import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity, MessageEntity, AgentLearningEntity } from '@kaizech/database';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

@Injectable()
export class LearningsCronService {
  private readonly logger = new Logger(LearningsCronService.name);

  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    @InjectRepository(AgentLearningEntity)
    private readonly agentLearningRepo: Repository<AgentLearningEntity>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleLearningExtraction(tenantId?: string) {
    this.logger.log(`Starting learning extraction job${tenantId ? ` for tenant ${tenantId}` : ''}...`);
    
    // Fetch conversations marked for learning in chunks of 50
    const limit = 50;
    const whereClause: any = { isLearned: false };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const conversations = await this.conversationRepo.find({
      where: whereClause,
      relations: ['tenant'],
      take: limit,
    });

    if (conversations.length === 0) {
      this.logger.log('No new conversations to learn from.');
      return;
    }

    for (const conv of conversations) {
      if (!conv.satisfactionScore) {
        conv.isLearned = true;
        await this.conversationRepo.save(conv);
        continue;
      }

      try {
        await this.extractLearning(conv);
      } catch (err) {
        this.logger.error(`Failed to extract learning for conv ${conv.id}:`, err);
      }
    }
  }

  private async extractLearning(conversation: ConversationEntity) {
    // Get last 10 messages
    const messages = await this.messageRepo.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    
    // Reverse to chronological order
    messages.reverse();

    const transcript = messages.map(m => `[${m.role}]: ${m.content}`).join('\n');

    const schema = z.object({
      rule: z.string().describe('The extracted learning rule for the agent'),
      category: z.string().describe('The category of the learning (e.g. tone, fact, policy)'),
      confidenceScore: z.number().min(0).max(100).describe('Confidence score in this extraction (0-100)'),
    });

    const customApiKey = conversation.tenant?.settings?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!customApiKey) {
      throw new Error("Missing API key for tenant");
    }

    const llm = new ChatOpenAI({
      apiKey: customApiKey,
      modelName: 'gpt-4o-mini',
      temperature: 0,
    }).withStructuredOutput(schema);

    const prompt = `
You are an AI Analyst. Review the following conversation transcript. 
The user gave a satisfaction score of ${conversation.satisfactionScore}/5.
User Feedback: ${conversation.satisfactionFeedback || 'None'}
Tags: ${JSON.stringify(conversation.metadata?.feedbackTags || [])}

Extract a concise learning rule that the agent should follow in the future.
If the score is 4 or 5, extract what the agent did well.
If the score is 1, 2, or 3, extract the mistake and how the agent should correct it.
Keep the rule under 2 sentences.

Transcript:
${transcript}
`;

    const result = await llm.invoke(prompt);

    const learning = this.agentLearningRepo.create({
      tenantId: conversation.tenantId,
      conversationId: conversation.id,
      learningRule: result.rule,
      category: result.category,
      confidenceScore: result.confidenceScore,
      originalLLMOutput: JSON.stringify(result),
    });

    await this.agentLearningRepo.save(learning);

    conversation.isLearned = true;
    await this.conversationRepo.save(conversation);
  }
}
