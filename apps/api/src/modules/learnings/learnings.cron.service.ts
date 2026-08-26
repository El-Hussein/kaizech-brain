import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ConversationEntity, MessageEntity, AgentLearningEntity } from '@kaizech/database';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { decryptSecret } from '@kaizech/shared';

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
    
    // Fetch conversations marked for learning in chunks of 500
    const limit = 500;
    const whereClause: FindOptionsWhere<ConversationEntity> = { isLearned: false };
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
      // Skip if conversation is too short to learn anything
      if (conv.messageCount < 2) {
        conv.isLearned = true;
        await this.conversationRepo.save(conv);
        continue;
      }

      try {
        await this.extractLearning(conv);
      } catch (err) {
        this.logger.error(`Failed to extract learning for conv ${conv.id}:`, err);
        // Mark as learned so it doesn't block the queue forever in case of persistent LLM validation errors
        conv.isLearned = true;
        await this.conversationRepo.save(conv);
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
      hasLearning: z.boolean().describe('True if there is a meaningful learning to extract from this conversation, False if it was just normal chatter'),
      rule: z.string().optional().describe('The extracted learning rule for the agent, if hasLearning is true'),
      category: z.string().optional().describe('The category of the learning (e.g. tone, fact, policy)'),
      confidenceScore: z.number().min(0).max(100).describe('Factual reliability of the rule (0-100). 0-10: contradicts known facts. 10-30: highly subjective. 30-50: user correction or preference. 50-70: plausible rule with partial evidence. 70-85: strong evidence from conversation. 85-100: definitively verified.'),
      inferredSatisfactionScore: z.number().min(1).max(5).optional().describe('Infer a satisfaction score out of 5 based on how happy/satisfied the user seems at the end.'),
      inferredFeedback: z.string().optional().describe('Briefly summarize why you gave this inferred score.'),
    });

    const rawApiKey = conversation.tenant?.settings?.openaiApiKey;
    const customApiKey = rawApiKey ? decryptSecret(rawApiKey) : process.env.OPENAI_API_KEY;
    if (!customApiKey) {
      throw new Error("Missing API key for tenant");
    }

    const llm = new ChatOpenAI({
      apiKey: customApiKey,
      modelName: process.env.OPENAI_MODEL || 'gpt-4o',
      temperature: 0,
    }).withStructuredOutput(schema);

    const prompt = `
You are an AI Analyst. Review the following conversation transcript. 
If the user provided an explicit rating, it is: ${conversation.satisfactionScore || 'N/A'}/5.

Analyze the conversation and do two things:
1. Infer a satisfaction score (1-5) based on keywords, tone, and whether the user got their answer. If they asked follow-ups, expressed frustration, or had to correct the agent, score lower (1-3). If they thanked the agent or seemed satisfied, score higher (4-5).
2. Extract a concise learning rule that the agent should follow in the future.
- Look for instances where the user corrects the agent, provides a specific fact, or expresses frustration.
- **CRITICAL**: If the agent states it "could not find information", if the user provides any factual correction or new information, or if the conversation is escalated to a human, THIS IS A LEARNING OPPORTUNITY. You MUST set \`hasLearning = true\` and extract a rule.
- If the score is low, extract the mistake and how the agent should correct it.
- If there is absolutely nothing meaningful to learn and the agent answered everything perfectly, set hasLearning to false.
Keep the rule under 2 sentences.

CRITICAL INSTRUCTION ON CONFIDENCE SCORE:
The \`confidenceScore\` represents the FACTUAL RELIABILITY of the extracted rule. Use the full 0-100 range:
  0-10  — Contradicts known facts or system data.
  10-30 — Highly subjective claim.
  30-50 — User correction, assertion, or preference (even if unverified).
  50-70 — Plausible rule with partial evidence. The user's statement aligns with context clues in the conversation, or the rule is about a behavioral pattern.
  70-85 — Strong evidence from the conversation. The rule is supported by multiple messages, the user provided verifiable details, or it aligns with known system behavior.
  85-100 — Definitively verified.

REMEMBER: User corrections and facts should generally score between 40-70. Do not overly penalize user-provided facts unless they clearly contradict known reality. We want the system to learn from users.

Transcript:
\${transcript}
`;

    const result = await llm.invoke(prompt);
    
    this.logger.log(`LLM Extraction Result for conv ${conversation.id}: hasLearning=${result.hasLearning}, inferredScore=${result.inferredSatisfactionScore}`);

    if (result.hasLearning && result.rule) {
      const confidence = result.confidenceScore !== undefined ? result.confidenceScore : 85;
      const status = confidence >= 50 ? 'approved' : 'pending';

      const learning = this.agentLearningRepo.create({
        tenantId: conversation.tenantId,
        conversationId: conversation.id,
        learningRule: result.rule,
        category: result.category || 'User Correction',
        confidenceScore: confidence,
        status: status as any,
        originalLLMOutput: JSON.stringify({
          ...result,
          transcript,
        }),
      });

      await this.agentLearningRepo.save(learning);
    }

    // Save the inferred score so the dashboard can display it later
    conversation.satisfactionScore = conversation.satisfactionScore || result.inferredSatisfactionScore || 3;
    conversation.satisfactionFeedback = conversation.satisfactionFeedback || result.inferredFeedback || 'Inferred by AI Analyst';
    conversation.isLearned = true;
    await this.conversationRepo.save(conversation);
  }
}
