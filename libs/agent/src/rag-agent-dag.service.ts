import { Injectable, Logger } from '@nestjs/common';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createVectorSearchTool } from './tools/vector-search.tool';
import { createGraphSearchTool } from './tools/graph-search.tool';
import { VectorSearchService } from '@kaizech/rag';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantEntity } from '@kaizech/database';
import { decryptSecret } from '@kaizech/shared';
import { ToolExecutorService } from '@kaizech/tools';

@Injectable()
export class RagAgentDagService {
  private readonly logger = new Logger(RagAgentDagService.name);

  constructor(
    private readonly vectorSearchService: VectorSearchService,
    private readonly providerFactory: AIProviderFactory,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly toolExecutor: ToolExecutorService,
  ) {}

  async runAgent(
    tenant: TenantEntity,
    userMessage: string,
    history: { role: string, content: string }[],
    customToolDefs: any[] = [],
    systemPrompt?: string,
  ): Promise<{ response: string, tokenUsage: { promptTokens: number, completionTokens: number, totalTokens: number } }> {
    const customApiKey = decryptSecret(tenant.settings?.openaiApiKey || process.env.OPENAI_API_KEY || '');
    if (!customApiKey) {
      throw new Error("API key not found for LangGraph");
    }

    const vectorTool = createVectorSearchTool(tenant.id, this.vectorSearchService, this.providerFactory, customApiKey);
    const graphTool = createGraphSearchTool(tenant.id, this.dataSource);
    
    // Create execution wrappers for custom tools
    const customExecutionTools = customToolDefs.map(def => {
      const { DynamicStructuredTool } = require('@langchain/core/tools');
      const { z } = require('zod');
      return new DynamicStructuredTool({
        name: def.function.name,
        description: def.function.description,
        schema: z.record(z.any()), // accept any structured arguments
        func: async (args: Record<string, any>) => {
          try {
            const res = await this.toolExecutor.executeTool(tenant, def.function.name, args);
            return typeof res === 'string' ? res : JSON.stringify(res);
          } catch (e: any) {
            return `Error executing tool: ${e.message}`;
          }
        }
      });
    });

    const executionTools = [vectorTool, graphTool, ...customExecutionTools] as any[];
    const toolNode = new (ToolNode as any)(executionTools);

    // Bind both langchain tools and raw openai schema tools to the model
    const toolsToBind = [vectorTool, graphTool, ...customToolDefs];
    
    const model = new ChatOpenAI({
      apiKey: customApiKey,
      modelName: tenant.settings?.openaiModel || 'gpt-4o-mini',
      temperature: 0,
    }).bindTools(toolsToBind);

    const shouldContinue = (state: typeof MessagesAnnotation.State) => {
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1];
      if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length > 0) {
        return "tools";
      }
      return "__end__";
    };

    const callModel = async (state: typeof MessagesAnnotation.State) => {
      const response = await model.invoke(state.messages);
      return { messages: [response] };
    };

    const workflow = new StateGraph(MessagesAnnotation)
      .addNode("agent", callModel)
      .addNode("tools", toolNode)
      .addEdge("__start__", "agent")
      .addConditionalEdges("agent", shouldContinue)
      .addEdge("tools", "agent");

    const app = workflow.compile();

    let finalSystemPrompt = systemPrompt || tenant.settings?.systemPrompt || "You are a helpful AI assistant. Use the provided tools (vector_search, graph_search) to find information and answer the user's questions based on the retrieved context.";

    try {
      const { OpenAIEmbeddings } = require('@langchain/openai');
      const embeddings = new OpenAIEmbeddings({ apiKey: customApiKey, modelName: 'text-embedding-3-small' });
      const vector = await embeddings.embedQuery(userMessage);
      const learnings = await this.vectorSearchService.searchLearnings(tenant.id, vector, 3);
      if (learnings && learnings.length > 0) {
        finalSystemPrompt += "\n\nCRITICAL - Please adhere to these learned rules from past user feedback:\n";
        learnings.forEach((l, index) => {
          finalSystemPrompt += `${index + 1}. ${l.content}\n`;
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch learnings: ${err.message}`);
    }
    
    const initialMessages: BaseMessage[] = [
      new SystemMessage(finalSystemPrompt),
      ...history.map(m => new HumanMessage({ content: m.content })),
      new HumanMessage(userMessage)
    ];

    try {
      const result = await app.invoke({ messages: initialMessages });
      const finalMessage = result.messages[result.messages.length - 1];
      
      let tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      if (finalMessage.response_metadata && finalMessage.response_metadata.tokenUsage) {
        tokenUsage = {
          promptTokens: finalMessage.response_metadata.tokenUsage.promptTokens || 0,
          completionTokens: finalMessage.response_metadata.tokenUsage.completionTokens || 0,
          totalTokens: finalMessage.response_metadata.tokenUsage.totalTokens || 0,
        };
      }
      
      return { response: finalMessage.content as string, tokenUsage };
    } catch (error: any) {
      this.logger.error(`LangGraph execution failed: ${error.message}`);
      throw error;
    }
  }
}
