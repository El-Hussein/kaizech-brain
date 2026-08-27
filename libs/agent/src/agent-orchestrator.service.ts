import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantEntity } from '@kaizech/database';
import { PromptBuilderService } from '@kaizech/prompts';
import { MemoryService, UserProfileService } from '@kaizech/memory';
import { ToolExecutorService } from '@kaizech/tools';
import { VectorSearchService } from '@kaizech/rag';
import { RagAgentDagService } from './rag-agent-dag.service';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { ChatMessage, MessageRole, ToolCall, ConversationStatus, ChatCompletionResult } from '@kaizech/shared';

export interface AgentProcessInput {
  tenant: TenantEntity;
  channelType: string;
  channelUserId: string;
  userMessage: string;
  displayName?: string;
  metadata?: Record<string, any>;
}

export interface AgentProcessResult {
  response: string;
  conversationId: string;
  status: string;
  toolCallsExecuted: Array<{ name: string; args: any; result: any }>;
  knowledgeSourcesUsed: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  responseTimeMs: number;
  handedOff?: boolean;
  handoffReason?: string;
  limit?: number;
  messageCount?: number;
  limitExceeded?: boolean;
}

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  private escalationIntentCache = new Map<string, number[]>();

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async isEscalationIntent(provider: any, userEmbedding: number[], customApiKey?: string): Promise<boolean> {
    const providerName = provider.constructor.name;
    const cacheKey = `${providerName}_escalation`;
    let intentEmbedding = this.escalationIntentCache.get(cacheKey);

    if (!intentEmbedding) {
      // Representative intent phrase focusing on the desire to speak to a human or agent
      const intentPhrase = "I want to talk to a human agent, please connect me to customer support representative, اريد التحدث مع الدعم الفني او موظف خدمة العملاء";
      intentEmbedding = await provider.generateEmbedding(intentPhrase, undefined, customApiKey);
      this.escalationIntentCache.set(cacheKey, intentEmbedding);
    }

    const similarity = this.cosineSimilarity(userEmbedding, intentEmbedding);
    this.logger.debug(`Semantic escalation similarity: ${similarity.toFixed(4)}`);
    return similarity > 0.84; // Threshold to prevent false positives when users just ask ABOUT support
  }

  private isUnanswerableFallback(content: string): boolean {
    if (!content) return true;
    const lower = content.toLowerCase().trim();
    const fallbackPhrases = [
      "i don't have enough information",
      "i cannot answer this",
      "i am unable to assist",
      "please contact support",
      "speak to a human",
      "no relevant information",
      "لا أستطيع الإجابة",
      "عذراً لا تتوفر لدي معلومات",
      "يرجى التواصل مع الدعم",
      "لا أستطيع مساعدتك في هذا",
    ];
    return fallbackPhrases.some((phrase) => lower.includes(phrase));
  }

  constructor(
    private readonly providerFactory: AIProviderFactory,
    private readonly promptBuilder: PromptBuilderService,
    private readonly memoryService: MemoryService,
    private readonly userProfileService: UserProfileService,
    private readonly toolExecutor: ToolExecutorService,
    private readonly vectorSearch: VectorSearchService,
    private readonly ragAgentDag: RagAgentDagService,
  ) {}

  async processMessage(input: AgentProcessInput): Promise<AgentProcessResult> {
    const startTime = Date.now();
    const { tenant, channelType, channelUserId, userMessage, displayName, metadata } = input;

    this.logger.log(`Processing message for tenant '${tenant.name}' user '${channelUserId}' via '${channelType}'`);

    // 1 & 2 & Tool definitions: Execute initial DB operations in parallel ⚡
    const [userProfile, conversation, toolDefinitions] = await Promise.all([
      this.userProfileService.getOrCreateProfile(
        tenant.id,
        channelUserId,
        channelType,
        displayName,
      ),
      this.memoryService.getOrCreateConversation(
        tenant.id,
        channelType,
        channelUserId,
      ),
      this.toolExecutor.getToolDefinitionsForTenant(tenant.id),
    ]);

    // Determine limit
    const maxLimit =
      typeof conversation.metadata?.maxMessages === 'number'
        ? conversation.metadata.maxMessages
        : typeof tenant.settings?.maxMessagesPerConversation === 'number'
        ? tenant.settings.maxMessagesPerConversation
        : typeof tenant.settings?.maxConversationMessages === 'number'
        ? tenant.settings.maxConversationMessages
        : 0;

    const currentMessageCount = (conversation.messageCount || 0) + 1;
    const isLimitExceeded = maxLimit > 0 && currentMessageCount >= maxLimit;

    // 3. Save incoming user message
    await this.memoryService.addMessage(
      conversation.id,
      MessageRole.USER,
      userMessage,
      channelType,
      { metadata },
    );

    // 3b. Check if conversation is already handed off
    if (conversation.status === ConversationStatus.HANDED_OFF) {
      this.logger.log(
        `Conversation ${conversation.id} for user '${channelUserId}' is HANDED_OFF to human support. AI reply paused.`,
      );
      return {
        response: 'Conversation is currently in hands-off mode for human support.',
        conversationId: conversation.id,
        status: ConversationStatus.HANDED_OFF,
        toolCallsExecuted: [],
        knowledgeSourcesUsed: 0,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTimeMs: Date.now() - startTime,
        handedOff: true,
        limit: maxLimit,
        messageCount: currentMessageCount,
        limitExceeded: isLimitExceeded,
      };
    }

    // 3c. Check message limit
    if (isLimitExceeded) {
      this.logger.log(
        `Conversation ${conversation.id} reached message limit (${currentMessageCount}/${maxLimit}). Automatically transitioning to HANDED_OFF status.`,
      );

      await this.memoryService.handoverConversation(conversation.id);

      const handoffNotice =
        tenant.settings?.handoffMessage ||
        `⚠️ Conversation message limit reached (${currentMessageCount}/${maxLimit}). AI chat stopped and handed off to human support.`;

      await this.memoryService.addMessage(
        conversation.id,
        MessageRole.SYSTEM,
        handoffNotice,
        channelType,
      );

      const responseTimeMs = Date.now() - startTime;

      return {
        response: handoffNotice,
        conversationId: conversation.id,
        status: ConversationStatus.HANDED_OFF,
        toolCallsExecuted: [],
        knowledgeSourcesUsed: 0,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTimeMs,
        handedOff: true,
        limit: maxLimit,
        messageCount: currentMessageCount,
        limitExceeded: true,
      };
    }

    // 3d. User Escalation Keyword Check (Moved to Semantic Check at step 4.5)
    // 4 & 6. Parallelize Memory Summary, Recent Messages, FAQ check & Embedding Generation ⚡
    const activeProviderName = tenant.settings?.aiProvider || 'openai';
    const provider = this.providerFactory.getProvider(activeProviderName);
    const customApiKey = activeProviderName === 'groq'
      ? (tenant.settings?.groqApiKey || tenant.settings?.openaiApiKey)
      : tenant.settings?.openaiApiKey;
    const customModel = activeProviderName === 'groq'
      ? tenant.settings?.groqModel
      : tenant.settings?.openaiModel;

    const [summary, recentMessages, hasFaqs, directMatch, userEmbedding] = await Promise.all([
      this.memoryService.getConversationSummary(conversation.id),
      this.memoryService.getRecentMessages(conversation.id, 10),
      this.vectorSearch.hasFaqSources(tenant.id),
      this.vectorSearch.findDirectFaqMatch(tenant.id, userMessage),
      provider.generateEmbedding(userMessage, undefined, customApiKey),
    ]);

    // 4.5 Semantic Escalation Check
    const autoHandoffOnKeywords = tenant.settings?.autoHandoffOnKeywords !== false;
    if (autoHandoffOnKeywords && userEmbedding && userEmbedding.length > 0) {
      const isEscalation = await this.isEscalationIntent(provider, userEmbedding, customApiKey);
      if (isEscalation) {
        this.logger.log(`User semantic intent triggered automatic human handoff for conversation ${conversation.id}`);
        await this.memoryService.handoverConversation(conversation.id);

        const handoffNotice =
          tenant.settings?.handoffMessage ||
          '⚠️ Escalation requested by user. AI chat stopped and handed off to human support.';

        await this.memoryService.addMessage(
          conversation.id,
          MessageRole.SYSTEM,
          handoffNotice,
          channelType,
        );

        return {
          response: handoffNotice,
          conversationId: conversation.id,
          status: ConversationStatus.HANDED_OFF,
          toolCallsExecuted: [],
          knowledgeSourcesUsed: 0,
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          responseTimeMs: Date.now() - startTime,
          handedOff: true,
          handoffReason: 'USER_SEMANTIC_ESCALATION',
          limit: maxLimit,
          messageCount: currentMessageCount,
          limitExceeded: isLimitExceeded,
        };
      }
    }

    // 5. PRE-REPLY FAQ LAYER
    const faqBotMode = tenant.settings?.faqBotMode || 'strict_first';
    const faqStrictThreshold =
      typeof tenant.settings?.faqStrictThreshold === 'number'
        ? tenant.settings.faqStrictThreshold
        : 0.75;

    if (faqBotMode === 'strict_first' && hasFaqs) {
      try {
        let bestFaq = directMatch;

        if (!bestFaq) {
          const faqMatches = await this.vectorSearch.searchFaqs(
            tenant.id,
            userEmbedding,
            1,
            faqStrictThreshold,
          );
          if (faqMatches.length > 0) {
            bestFaq = faqMatches[0];
          }
        }

        if (bestFaq) {
          this.logger.log(
            `Strict FAQ match found for tenant '${tenant.name}' (similarity: ${bestFaq.similarity.toFixed(4)})`,
          );

          let faqAnswer = bestFaq.content;
          const answerMatch = faqAnswer.match(/Answer:\s*([\s\S]+?)(?:\nCategory:|\n\n---\n\n|$)/i);
          if (answerMatch && answerMatch[1]) {
            faqAnswer = answerMatch[1].trim();
          }

          const responseTimeMs = Date.now() - startTime;

          await this.memoryService.addMessage(
            conversation.id,
            MessageRole.ASSISTANT,
            faqAnswer,
            channelType,
            {
              tokenUsagePrompt: 0,
              tokenUsageCompletion: 0,
              responseTimeMs,
              metadata: {
                faqDirectMatch: true,
                similarity: bestFaq.similarity,
              },
            },
          );

          return {
            response: faqAnswer,
            conversationId: conversation.id,
            status: ConversationStatus.ACTIVE,
            toolCallsExecuted: [],
            knowledgeSourcesUsed: 1,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            responseTimeMs,
            handedOff: false,
            limit: maxLimit,
            messageCount: currentMessageCount + 1,
            limitExceeded: false,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Strict FAQ retrieval warning: ${err.message}`);
      }
    }

    // 6 & 7 & 8 & 9. RAG + Tool Loop using LangGraph DAG
    let finalResponse = '';
    const totalTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const toolCallsExecuted: any[] = [];
    
    const historyForDag = recentMessages.map(m => ({ role: m.role, content: m.content || '' }));
    
    let knowledgeTexts: string[] = [];
    try {
      const chunks = await this.vectorSearch.search(tenant.id, userEmbedding, 3, 0.4);
      knowledgeTexts = chunks.map((c) => c.content);
    } catch (err: any) {
      this.logger.warn(`Knowledge retrieval warning: ${err.message}`);
    }

    const systemPrompt = await this.promptBuilder.buildSystemPrompt({
      tenant,
      userProfile,
      summary,
      knowledgeContext: knowledgeTexts,
      currentLanguage: userProfile.preferredLanguage,
    });

    try {
      this.logger.log(`Invoking RagAgentDagService for conversation ${conversation.id}`);
      const dagResult = await this.ragAgentDag.runAgent(tenant, userMessage, historyForDag, toolDefinitions, systemPrompt);
      finalResponse = dagResult.response;
      totalTokenUsage.promptTokens = dagResult.tokenUsage.promptTokens;
      totalTokenUsage.completionTokens = dagResult.tokenUsage.completionTokens;
      totalTokenUsage.totalTokens = dagResult.tokenUsage.totalTokens;
    } catch (err: any) {
      this.logger.error(`RagAgentDagService execution error: ${err.message}`);
      const autoHandoffOnError = tenant.settings?.autoHandoffOnError !== false;
      if (autoHandoffOnError) {
        await this.memoryService.handoverConversation(conversation.id);
        const handoffNotice =
          tenant.settings?.handoffMessage ||
          `⚠️ AI Provider Error: ${err.message}. Conversation handed off to human support.`;

        await this.memoryService.addMessage(
          conversation.id,
          MessageRole.SYSTEM,
          handoffNotice,
          channelType,
        );

        return {
          response: handoffNotice,
          conversationId: conversation.id,
          status: ConversationStatus.HANDED_OFF,
          toolCallsExecuted: [],
          knowledgeSourcesUsed: 0,
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          responseTimeMs: Date.now() - startTime,
          handedOff: true,
          handoffReason: 'AI_PROVIDER_ERROR',
          limit: maxLimit,
          messageCount: currentMessageCount,
          limitExceeded: isLimitExceeded,
        };
      }

      const errResponse = `⚠️ AI Error: ${err.message}. Please verify your API key in tenant settings or environment variables.`;
      return {
        response: errResponse,
        conversationId: conversation.id,
        status: ConversationStatus.ACTIVE,
        toolCallsExecuted: [],
        knowledgeSourcesUsed: 0,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTimeMs: Date.now() - startTime,
        handedOff: false,
        limit: maxLimit,
        messageCount: currentMessageCount + 1,
        limitExceeded: false,
      };
    }

    const responseTimeMs = Date.now() - startTime;

    // 9b. Check Fallback / Unanswerable Auto-Handoff Rule
    const autoHandoffOnUncertainty = tenant.settings?.autoHandoffOnUncertainty !== false;
    if (autoHandoffOnUncertainty && this.isUnanswerableFallback(finalResponse)) {
      this.logger.log(
        `AI fallback / unanswerable response detected. Transitioning conversation ${conversation.id} to HANDED_OFF status.`,
      );

      await this.memoryService.handoverConversation(conversation.id);

      const handoffNotice =
        tenant.settings?.handoffMessage ||
        '⚠️ AI could not answer your inquiry with full confidence. Conversation handed off to human support.';

      await this.memoryService.addMessage(
        conversation.id,
        MessageRole.SYSTEM,
        handoffNotice,
        channelType,
      );

      return {
        response: handoffNotice,
        conversationId: conversation.id,
        status: ConversationStatus.HANDED_OFF,
        toolCallsExecuted,
        knowledgeSourcesUsed: knowledgeTexts.length,
        tokenUsage: totalTokenUsage,
        responseTimeMs,
        handedOff: true,
        handoffReason: 'UNANSWERABLE_FALLBACK',
        limit: maxLimit,
        messageCount: currentMessageCount + 1,
        limitExceeded: false,
      };
    }

    // 10. Save Assistant Final Message
    await this.memoryService.addMessage(
      conversation.id,
      MessageRole.ASSISTANT,
      finalResponse,
      channelType,
      {
        tokenUsagePrompt: totalTokenUsage.promptTokens,
        tokenUsageCompletion: totalTokenUsage.completionTokens,
        responseTimeMs,
        toolCalls: toolCallsExecuted.length > 0 ? toolCallsExecuted : undefined,
        metadata: knowledgeTexts.length > 0 ? { knowledgeSources: knowledgeTexts } : undefined,
      },
    );

    return {
      response: finalResponse,
      conversationId: conversation.id,
      status: ConversationStatus.ACTIVE,
      toolCallsExecuted,
      knowledgeSourcesUsed: knowledgeTexts.length,
      tokenUsage: totalTokenUsage,
      responseTimeMs,
      handedOff: false,
      limit: maxLimit,
      messageCount: currentMessageCount + 1,
      limitExceeded: false,
    };
  }

  async processMessageStream(
    input: AgentProcessInput,
    onChunk: (chunk: string) => void,
  ): Promise<AgentProcessResult> {
    const startTime = Date.now();
    const { tenant, channelType, channelUserId, userMessage, displayName, metadata } = input;

    // Execute initial DB operations in parallel ⚡
    const [userProfile, conversation, toolDefinitions] = await Promise.all([
      this.userProfileService.getOrCreateProfile(tenant.id, channelUserId, channelType, displayName),
      this.memoryService.getOrCreateConversation(tenant.id, channelType, channelUserId),
      this.toolExecutor.getToolDefinitionsForTenant(tenant.id),
    ]);

    const maxLimit =
      typeof conversation.metadata?.maxMessages === 'number'
        ? conversation.metadata.maxMessages
        : typeof tenant.settings?.maxMessagesPerConversation === 'number'
        ? tenant.settings.maxMessagesPerConversation
        : typeof tenant.settings?.maxConversationMessages === 'number'
        ? tenant.settings.maxConversationMessages
        : 0;

    const currentMessageCount = (conversation.messageCount || 0) + 1;
    const isLimitExceeded = maxLimit > 0 && currentMessageCount >= maxLimit;

    await this.memoryService.addMessage(
      conversation.id,
      MessageRole.USER,
      userMessage,
      channelType,
      { metadata },
    );

    if (conversation.status === ConversationStatus.HANDED_OFF) {
      const msg = 'Conversation is currently in hands-off mode for human support.';
      onChunk(msg);
      return {
        response: msg,
        conversationId: conversation.id,
        status: ConversationStatus.HANDED_OFF,
        toolCallsExecuted: [],
        knowledgeSourcesUsed: 0,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTimeMs: Date.now() - startTime,
        handedOff: true,
        limit: maxLimit,
        messageCount: currentMessageCount,
        limitExceeded: isLimitExceeded,
      };
    }

    if (isLimitExceeded) {
      await this.memoryService.handoverConversation(conversation.id);
      const handoffNotice =
        tenant.settings?.handoffMessage ||
        `⚠️ Conversation message limit reached (${currentMessageCount}/${maxLimit}). AI chat stopped and handed off to human support.`;
      onChunk(handoffNotice);
      await this.memoryService.addMessage(
        conversation.id,
        MessageRole.SYSTEM,
        handoffNotice,
        channelType,
      );
      return {
        response: handoffNotice,
        conversationId: conversation.id,
        status: ConversationStatus.HANDED_OFF,
        toolCallsExecuted: [],
        knowledgeSourcesUsed: 0,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTimeMs: Date.now() - startTime,
        handedOff: true,
        limit: maxLimit,
        messageCount: currentMessageCount,
        limitExceeded: true,
      };
    }

    const autoHandoffOnKeywords = tenant.settings?.autoHandoffOnKeywords !== false;
    if (
      autoHandoffOnKeywords &&
      this.isEscalationKeyword(userMessage, tenant.settings?.autoHandoffKeywords)
    ) {
      await this.memoryService.handoverConversation(conversation.id);
      const handoffNotice =
        tenant.settings?.handoffMessage ||
        '⚠️ Escalation requested by user. AI chat stopped and handed off to human support.';
      onChunk(handoffNotice);
      await this.memoryService.addMessage(
        conversation.id,
        MessageRole.SYSTEM,
        handoffNotice,
        channelType,
      );
      return {
        response: handoffNotice,
        conversationId: conversation.id,
        status: ConversationStatus.HANDED_OFF,
        toolCallsExecuted: [],
        knowledgeSourcesUsed: 0,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTimeMs: Date.now() - startTime,
        handedOff: true,
        handoffReason: 'USER_KEYWORD_ESCALATION',
        limit: maxLimit,
        messageCount: currentMessageCount,
        limitExceeded: isLimitExceeded,
      };
    }

    const activeProviderName = tenant.settings?.aiProvider || 'openai';
    const provider = this.providerFactory.getProvider(activeProviderName);
    const customApiKey = activeProviderName === 'groq'
      ? (tenant.settings?.groqApiKey || tenant.settings?.openaiApiKey)
      : tenant.settings?.openaiApiKey;
    const customModel = activeProviderName === 'groq'
      ? tenant.settings?.groqModel
      : tenant.settings?.openaiModel;

    const [summary, recentMessages, hasFaqs, directMatch, userEmbedding] = await Promise.all([
      this.memoryService.getConversationSummary(conversation.id),
      this.memoryService.getRecentMessages(conversation.id, 10),
      this.vectorSearch.hasFaqSources(tenant.id),
      this.vectorSearch.findDirectFaqMatch(tenant.id, userMessage),
      provider.generateEmbedding(userMessage, undefined, customApiKey),
    ]);

    const faqBotMode = tenant.settings?.faqBotMode || 'strict_first';
    const faqStrictThreshold =
      typeof tenant.settings?.faqStrictThreshold === 'number'
        ? tenant.settings.faqStrictThreshold
        : 0.75;

    if (faqBotMode === 'strict_first' && hasFaqs) {
      try {
        let bestFaq = directMatch;
        if (!bestFaq) {
          const faqMatches = await this.vectorSearch.searchFaqs(
            tenant.id,
            userEmbedding,
            1,
            faqStrictThreshold,
          );
          if (faqMatches.length > 0) {
            bestFaq = faqMatches[0];
          }
        }

        if (bestFaq) {
          let faqAnswer = bestFaq.content;
          const answerMatch = faqAnswer.match(/Answer:\s*([\s\S]+?)(?:\nCategory:|\n\n---\n\n|$)/i);
          if (answerMatch && answerMatch[1]) {
            faqAnswer = answerMatch[1].trim();
          }

          onChunk(faqAnswer);
          const responseTimeMs = Date.now() - startTime;

          await this.memoryService.addMessage(
            conversation.id,
            MessageRole.ASSISTANT,
            faqAnswer,
            channelType,
            {
              tokenUsagePrompt: 0,
              tokenUsageCompletion: 0,
              responseTimeMs,
              metadata: { faqDirectMatch: true, similarity: bestFaq.similarity },
            },
          );

          return {
            response: faqAnswer,
            conversationId: conversation.id,
            status: ConversationStatus.ACTIVE,
            toolCallsExecuted: [],
            knowledgeSourcesUsed: 1,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            responseTimeMs,
            handedOff: false,
            limit: maxLimit,
            messageCount: currentMessageCount + 1,
            limitExceeded: false,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Strict FAQ retrieval warning in stream: ${err.message}`);
      }
    }

    let knowledgeTexts: string[] = [];
    try {
      const chunks = await this.vectorSearch.search(tenant.id, userEmbedding, 3, 0.4);
      knowledgeTexts = chunks.map((c) => c.content);
    } catch (err: any) {
      this.logger.warn(`Knowledge retrieval warning in stream: ${err.message}`);
    }

    const systemPrompt = await this.promptBuilder.buildSystemPrompt({
      tenant,
      userProfile,
      summary,
      knowledgeContext: knowledgeTexts,
      currentLanguage: userProfile.preferredLanguage,
    });

    const llmMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
    ];

    let llmResult: ChatCompletionResult | undefined = undefined;
    let finalResponse = '';
    const toolCallsExecuted: any[] = [];
    const totalTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const currentMessages = [...llmMessages];

    try {
      let loopCount = 0;
      const MAX_LOOPS = 5;

      while (loopCount < MAX_LOOPS) {
        loopCount++;

        if (provider.chatCompletionStream) {
          llmResult = await provider.chatCompletionStream(
            {
              messages: currentMessages,
              tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
              apiKey: customApiKey,
              model: customModel,
            },
            onChunk,
          );
        } else {
          llmResult = await provider.chatCompletion({
            messages: currentMessages,
            tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
            apiKey: customApiKey,
            model: customModel,
          });
          if (llmResult.content) {
            onChunk(llmResult.content);
          }
        }

        if (llmResult.usage) {
          totalTokenUsage.promptTokens += llmResult.usage.promptTokens || 0;
          totalTokenUsage.completionTokens += llmResult.usage.completionTokens || 0;
          totalTokenUsage.totalTokens += llmResult.usage.totalTokens || 0;
        }

        if (llmResult.content) {
          finalResponse += llmResult.content;
        }

        if (!llmResult.toolCalls || llmResult.toolCalls.length === 0) {
          break;
        }

        currentMessages.push({
          role: 'assistant',
          content: llmResult.content || '',
          toolCalls: llmResult.toolCalls,
        });

        for (const tc of llmResult.toolCalls) {
          try {
            const args = typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments || '{}')
              : tc.function.arguments;

            const result = await this.toolExecutor.executeTool(tenant, tc.function.name, args);
            toolCallsExecuted.push({ name: tc.function.name, args, result });

            currentMessages.push({
              role: 'tool',
              toolCallId: tc.id,
              name: tc.function.name,
              content: typeof result === 'object' ? JSON.stringify(result) : String(result),
            });
          } catch (e: any) {
            this.logger.error(`Tool execution error in stream for ${tc.function.name}: ${e.message}`);
            currentMessages.push({
              role: 'tool',
              toolCallId: tc.id,
              name: tc.function.name,
              content: `Error: ${e.message}`,
            });
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`AI stream completion error (${activeProviderName}): ${err.message}`);
      const errResponse = `⚠️ AI Provider (${activeProviderName.toUpperCase()}) Error: ${err.message}. Please verify your API key in tenant settings or environment variables.`;
      onChunk(errResponse);
      return {
        response: errResponse,
        conversationId: conversation.id,
        status: ConversationStatus.ACTIVE,
        toolCallsExecuted: [],
        knowledgeSourcesUsed: knowledgeTexts.length,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTimeMs: Date.now() - startTime,
        handedOff: false,
        limit: maxLimit,
        messageCount: currentMessageCount + 1,
        limitExceeded: false,
      };
    }

    if (!finalResponse) {
      finalResponse = 'I have completed your request.';
      onChunk(finalResponse);
    }
    const responseTimeMs = Date.now() - startTime;

    await this.memoryService.addMessage(
      conversation.id,
      MessageRole.ASSISTANT,
      finalResponse,
      channelType,
      {
        tokenUsagePrompt: totalTokenUsage.promptTokens,
        tokenUsageCompletion: totalTokenUsage.completionTokens,
        responseTimeMs,
        toolCalls: toolCallsExecuted.length > 0 ? toolCallsExecuted : undefined,
        metadata: knowledgeTexts.length > 0 ? { knowledgeSources: knowledgeTexts } : undefined,
      },
    );

    return {
      response: finalResponse,
      conversationId: conversation.id,
      status: ConversationStatus.ACTIVE,
      toolCallsExecuted,
      knowledgeSourcesUsed: knowledgeTexts.length,
      tokenUsage: totalTokenUsage,
      responseTimeMs,
      handedOff: false,
      limit: maxLimit,
      messageCount: currentMessageCount + 1,
      limitExceeded: false,
    };
  }
}
