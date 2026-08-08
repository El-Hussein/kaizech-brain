import { Injectable, Logger } from '@nestjs/common';
import { TenantEntity } from '@kaizech/database';
import { PromptBuilderService } from '@kaizech/prompts';
import { MemoryService, UserProfileService } from '@kaizech/memory';
import { ToolExecutorService } from '@kaizech/tools';
import { VectorSearchService } from '@kaizech/rag';
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

  private isEscalationKeyword(userMessage: string, customKeywords?: string): boolean {
    if (!userMessage) return false;
    const lower = userMessage.toLowerCase().trim();
    const defaultKeywords = [
      'human',
      'agent',
      'support',
      'representative',
      'real person',
      'talk to human',
      'speak to human',
      'escalate',
      'إنسان',
      'موظف',
      'دعم',
      'خدمة العملاء',
      'مساعد بشري',
      'تحدث مع موظف',
    ];
    let keywords = defaultKeywords;
    if (customKeywords && customKeywords.trim()) {
      const customList = customKeywords
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      if (customList.length > 0) {
        keywords = [...defaultKeywords, ...customList];
      }
    }
    return keywords.some((kw) => lower.includes(kw));
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

import { RagAgentDagService } from './rag-agent-dag.service';

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

    // 3d. User Escalation Keyword Check
    const autoHandoffOnKeywords = tenant.settings?.autoHandoffOnKeywords !== false;
    if (
      autoHandoffOnKeywords &&
      this.isEscalationKeyword(userMessage, tenant.settings?.autoHandoffKeywords)
    ) {
      this.logger.log(
        `User keyword triggered automatic human handoff for conversation ${conversation.id}`,
      );

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
        handoffReason: 'USER_KEYWORD_ESCALATION',
        limit: maxLimit,
        messageCount: currentMessageCount,
        limitExceeded: isLimitExceeded,
      };
    }

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
    
    try {
      this.logger.log(`Invoking RagAgentDagService for conversation ${conversation.id}`);
      finalResponse = await this.ragAgentDag.runAgent(tenant, userMessage, historyForDag);
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
    const knowledgeTexts: string[] = []; // Tracked internally by DAG now

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

    let llmResult: ChatCompletionResult;
    try {
      if (provider.chatCompletionStream) {
        llmResult = await provider.chatCompletionStream(
          {
            messages: llmMessages,
            tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
            apiKey: customApiKey,
            model: customModel,
          },
          onChunk,
        );
      } else {
        llmResult = await provider.chatCompletion({
          messages: llmMessages,
          tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
          apiKey: customApiKey,
          model: customModel,
        });
        if (llmResult.content) {
          onChunk(llmResult.content);
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

    const finalResponse = llmResult.content || 'I have completed your request.';
    const responseTimeMs = Date.now() - startTime;

    await this.memoryService.addMessage(
      conversation.id,
      MessageRole.ASSISTANT,
      finalResponse,
      channelType,
      {
        tokenUsagePrompt: llmResult.usage.promptTokens,
        tokenUsageCompletion: llmResult.usage.completionTokens,
        responseTimeMs,
      },
    );

    return {
      response: finalResponse,
      conversationId: conversation.id,
      status: ConversationStatus.ACTIVE,
      toolCallsExecuted: [],
      knowledgeSourcesUsed: knowledgeTexts.length,
      tokenUsage: llmResult.usage,
      responseTimeMs,
      handedOff: false,
      limit: maxLimit,
      messageCount: currentMessageCount + 1,
      limitExceeded: false,
    };
  }
}
