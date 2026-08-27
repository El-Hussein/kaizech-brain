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
      // Removed message count check to allow learning from single-interaction conversations
      // where the user might ask a question, get a bad answer, and leave without correcting it.

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
You are an AI conversation quality analyst.

Your job is to evaluate a conversation between a USER and an AI AGENT.

You must perform TWO independent evaluations:
A. Determine the user's likely satisfaction (inferredSatisfactionScore).
B. Determine whether the conversation contains a genuine learning opportunity for improving the AI agent (hasLearning).

Do NOT assume that every follow-up question, correction, or negative sentiment is a learning opportunity.

==================================================
INPUT
==================================================
The user may have provided an explicit rating:
Explicit rating: ${conversation.satisfactionScore || 'N/A'}/5

Conversation:
\${transcript}

==================================================
PART A — SATISFACTION (inferredSatisfactionScore)
==================================================
Infer the user's final satisfaction with the interaction (1-5).
1 = Very dissatisfied (failed, repeatedly misunderstood, complained)
2 = Dissatisfied (partially helped, multiple corrections, frustration)
3 = Neutral / Mixed (some useful info, normal follow-ups, incomplete)
4 = Satisfied (successfully solved, minor clarification, positive)
5 = Very satisfied (completely solved, explicit thanks/praise)

IMPORTANT:
A follow-up question by itself does NOT mean dissatisfaction.
If an explicit user rating exists, treat it as strong evidence of satisfaction, but still analyze the conversation for contradictions.

==================================================
PART B — LEARNING OPPORTUNITY (hasLearning)
==================================================
A learning opportunity means:
"There is a specific, reusable change the AI agent should make in the future because something in this conversation provides evidence that its current behavior or knowledge is insufficient."

Do NOT create a learning rule merely because:
- The user asked a follow-up question.
- The user changed their mind or the conversation was long.
- The user expressed a personal preference that is not reusable.
- The agent gave a reasonable answer and the user simply continued.

CREATE hasLearning = true when at least one of the following occurs:
1. FACTUAL ERROR (agent stated something incorrect)
2. USER CORRECTION (user explicitly corrects a fact/requirement)
3. MISSING INFORMATION (agent doesn't know, user provides info)
4. WRONG ASSUMPTION (agent assumes incorrectly)
5. INSTRUCTION FOLLOWING FAILURE (agent fails explicit constraint)
6. REPEATED FAILURE (user has to explain more than once)
7. ESCALATION (escalated to human)
8. SYSTEM / WORKFLOW KNOWLEDGE (concrete workflow/business rule revealed)
9. REUSABLE USER PREFERENCE

==================================================
WHEN NOT TO LEARN
==================================================
Set hasLearning = false when:
- The agent was correct.
- No meaningful correction/mistake/missing knowledge.
- The user's follow-up is a natural continuation.
- The conversation contains only subjective disagreement.

==================================================
LEARNING RULE (rule)
==================================================
If hasLearning = true, create ONE concise, reusable rule describing what the AI should do differently.
- Be actionable and general enough for future conversations.
- Describe the desired behavior, not merely the mistake.
- Under 2 sentences. No specific IDs/names.

GOOD: "Before recommending a product, verify availability."
BAD: "The agent was wrong about the product."

==================================================
CATEGORY (category)
==================================================
Choose exactly ONE category: factual_error, missing_information, wrong_assumption, instruction_following, communication_style, product_knowledge, policy, tool_usage, workflow, user_preference, escalation, other. 
If hasLearning = false, omit or use "none".

==================================================
CONFIDENCE SCORE (confidenceScore)
==================================================
Represents how strongly the conversation supports the rule (0-100).
0-20: Unsupported, speculative.
21-40: Weak evidence, subjective.
41-60: User explicitly stated/corrected, but cannot be independently verified.
61-75: Strongly supported by conversation/repeated behavior.
76-90: Supported by multiple independent pieces of evidence.
91-100: Directly established by explicit system/business rule.

==================================================
REASON (inferredFeedback)
==================================================
Provide a short explanation of why the conversation was classified this way. Do not repeat the learning rule verbatim.

==================================================
FINAL CONSISTENCY RULES
==================================================
1. hasLearning=false MUST imply rule is empty/omitted.
2. hasLearning=true MUST imply rule is provided.
3. Satisfaction and learning are independent.
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
