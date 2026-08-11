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

@Injectable()
export class RagAgentDagService {
  private readonly logger = new Logger(RagAgentDagService.name);

  constructor(
    private readonly vectorSearchService: VectorSearchService,
    private readonly providerFactory: AIProviderFactory,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async runAgent(
    tenant: TenantEntity,
    userMessage: string,
    history: { role: string, content: string }[],
  ): Promise<string> {
    const customApiKey = tenant.settings?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!customApiKey) {
      throw new Error("API key not found for LangGraph");
    }

    const vectorTool = createVectorSearchTool(tenant.id, this.vectorSearchService, this.providerFactory, customApiKey);
    const graphTool = createGraphSearchTool(tenant.id, this.dataSource);
    
    const tools = [vectorTool, graphTool];
    const toolNode = new ToolNode(tools);

    const model = new ChatOpenAI({
      apiKey: customApiKey,
      modelName: tenant.settings?.openaiModel || 'gpt-4o-mini',
      temperature: 0,
    }).bindTools(tools);

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

    let systemPrompt = tenant.settings?.systemPrompt || "You are a helpful AI assistant. Use the provided tools (vector_search, graph_search) to find information and answer the user's questions based on the retrieved context.";

    try {
      const { OpenAIEmbeddings } = require('@langchain/openai');
      const embeddings = new OpenAIEmbeddings({ apiKey: customApiKey, modelName: 'text-embedding-3-small' });
      const vector = await embeddings.embedQuery(userMessage);
      const learnings = await this.vectorSearchService.searchLearnings(tenant.id, vector, 3);
      if (learnings && learnings.length > 0) {
        systemPrompt += "\n\nCRITICAL - Please adhere to these learned rules from past user feedback:\n";
        learnings.forEach((l, index) => {
          systemPrompt += `${index + 1}. ${l.content}\n`;
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch learnings: ${err.message}`);
    }
    
    const initialMessages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      ...history.map(m => new HumanMessage({ content: m.content })),
      new HumanMessage(userMessage)
    ];

    try {
      const result = await app.invoke({ messages: initialMessages });
      const finalMessage = result.messages[result.messages.length - 1];
      return finalMessage.content as string;
    } catch (error: any) {
      this.logger.error(`LangGraph execution failed: ${error.message}`);
      throw error;
    }
  }
}
