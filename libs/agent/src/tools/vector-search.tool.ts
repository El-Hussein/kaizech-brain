import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { VectorSearchService } from '@kaizech/rag';
import { AIProviderFactory } from '../providers/ai-provider.factory';

export const createVectorSearchTool = (
  tenantId: string,
  vectorSearchService: VectorSearchService,
  providerFactory: AIProviderFactory,
  customApiKey?: string
) => {
  return new (DynamicStructuredTool as any)({
    name: 'vector_search',
    description: 'Search the knowledge base for semantic matches to the user query. Use this for general information retrieval from documents.',
    schema: (z as any).object({
      query: (z as any).string().describe('The search query to find information about.'),
    }),
    func: async ({ query }: { query: string }) => {
      try {
        const provider = providerFactory.getProvider('openai');
        const embedding = await provider.generateEmbedding(query, undefined, customApiKey);
        
        const results = await vectorSearchService.search(tenantId, embedding, 3, 0.4);
        
        if (!results || results.length === 0) {
          return "No relevant information found in the document vector store.";
        }
        
        return results.map(r => `Source Content:\n${r.content}`).join('\n\n---\n\n');
      } catch (err: any) {
        return `Error searching vector store: ${err.message}`;
      }
    },
  });
};
