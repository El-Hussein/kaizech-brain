import { Injectable, Logger } from '@nestjs/common';
import { TenantEntity } from '@kaizech/database';
import { PromptBuilderService } from '@kaizech/prompts';
import { MemoryService, UserProfileService } from '@kaizech/memory';
import { ToolExecutorService } from '@kaizech/tools';
import { VectorSearchService } from '@kaizech/rag';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { ChatMessage, MessageRole, ToolCall } from '@kaizech/shared';

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
  toolCallsExecuted: Array<{ name: string; args: any; result: any }>;
  knowledgeSourcesUsed: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  responseTimeMs: number;
}

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  constructor(
    private readonly providerFactory: AIProviderFactory,
    private readonly promptBuilder: PromptBuilderService,
    private readonly memoryService: MemoryService,
    private readonly userProfileService: UserProfileService,
    private readonly toolExecutor: ToolExecutorService,
    private readonly vectorSearch: VectorSearchService,
  ) {}

  async processMessage(input: AgentProcessInput): Promise<AgentProcessResult> {
    const startTime = Date.now();
    const { tenant, channelType, channelUserId, userMessage, displayName, metadata } = input;

    this.logger.log(`Processing message for tenant '${tenant.name}' user '${channelUserId}' via '${channelType}'`);

    // 1. Get or Create User Profile
    const userProfile = await this.userProfileService.getOrCreateProfile(
      tenant.id,
      channelUserId,
      channelType,
      displayName,
    );

    // 2. Get or Create Conversation
    const conversation = await this.memoryService.getOrCreateConversation(
      tenant.id,
      channelType,
      channelUserId,
    );

    // 3. Save incoming user message
    await this.memoryService.addMessage(
      conversation.id,
      MessageRole.USER,
      userMessage,
      channelType,
      { metadata },
    );

    // 4. Retrieve Memory (Summary + Recent Messages)
    const summary = await this.memoryService.getConversationSummary(conversation.id);
    const recentMessages = await this.memoryService.getRecentMessages(conversation.id, 10);

    // 5. RAG: Vector Search for relevant Knowledge
    const provider = this.providerFactory.getProvider('openai');
    let knowledgeTexts: string[] = [];

    try {
      const embedding = await provider.generateEmbedding(userMessage);
      const chunks = await this.vectorSearch.search(tenant.id, embedding, 5, 0.4);
      knowledgeTexts = chunks.map((c) => c.content);
    } catch (err: any) {
      this.logger.warn(`Knowledge retrieval warning: ${err.message}`);
    }

    // 6. Retrieve Tenant Tools
    const toolDefinitions = await this.toolExecutor.getToolDefinitionsForTenant(tenant.id);

    // 7. Build Dynamic System Prompt
    const systemPrompt = await this.promptBuilder.buildSystemPrompt({
      tenant,
      userProfile,
      summary,
      knowledgeContext: knowledgeTexts,
      currentLanguage: userProfile.preferredLanguage,
    });

    // Construct Messages array for LLM
    const llmMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
    ];

    // 8. Call LLM
    const totalTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const toolCallsExecuted: Array<{ name: string; args: any; result: any }> = [];

    let llmResult = await provider.chatCompletion({
      messages: llmMessages,
      tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
    });

    totalTokenUsage.promptTokens += llmResult.usage.promptTokens;
    totalTokenUsage.completionTokens += llmResult.usage.completionTokens;
    totalTokenUsage.totalTokens += llmResult.usage.totalTokens;

    // 9. Handle Tool Calls Loop (up to 3 turns)
    let turns = 0;
    while (llmResult.toolCalls && llmResult.toolCalls.length > 0 && turns < 3) {
      turns++;
      this.logger.log(`LLM requested ${llmResult.toolCalls.length} tool call(s) (Turn ${turns})`);

      // Add assistant message with tool calls to conversation history
      llmMessages.push({
        role: 'assistant',
        content: llmResult.content || '',
        toolCalls: llmResult.toolCalls,
      });

      for (const toolCall of llmResult.toolCalls) {
        const toolName = toolCall.function.name;
        let args: Record<string, any> = {};

        try {
          args = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          args = {};
        }

        let result: any;
        try {
          result = await this.toolExecutor.executeTool(tenant, toolName, args);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || error.message || `Tool '${toolName}' execution failed`;
          result = { error: errorMsg };
        }

        toolCallsExecuted.push({ name: toolName, args, result });

        // Add tool execution result back to conversation
        llmMessages.push({
          role: 'tool',
          content: typeof result === 'string' ? result : JSON.stringify(result),
          toolCallId: toolCall.id,
        });
      }

      // Call LLM again with tool results
      llmResult = await provider.chatCompletion({
        messages: llmMessages,
        tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
      });

      totalTokenUsage.promptTokens += llmResult.usage.promptTokens;
      totalTokenUsage.completionTokens += llmResult.usage.completionTokens;
      totalTokenUsage.totalTokens += llmResult.usage.totalTokens;
    }

    const finalResponse = llmResult.content || 'I have completed your request.';
    const responseTimeMs = Date.now() - startTime;

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
      toolCallsExecuted,
      knowledgeSourcesUsed: knowledgeTexts.length,
      tokenUsage: totalTokenUsage,
      responseTimeMs,
    };
  }
}
