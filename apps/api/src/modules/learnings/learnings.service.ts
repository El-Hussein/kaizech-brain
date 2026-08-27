import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentLearningEntity, AgentLearningStatus } from '@kaizech/database';
import { VectorSearchService } from '@kaizech/rag';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class LearningsService {
  constructor(
    @InjectRepository(AgentLearningEntity)
    private readonly agentLearningRepo: Repository<AgentLearningEntity>,
    private readonly vectorSearchService: VectorSearchService,
  ) {}

  async approveLearning(id: string, modifiedRule?: string) {
    const learning = await this.agentLearningRepo.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (!learning) {
      throw new NotFoundException(`Learning with ID ${id} not found`);
    }

    if (modifiedRule) {
      learning.learningRule = modifiedRule;
    }

    learning.status = AgentLearningStatus.APPROVED;
    // Assume admin for now
    learning.reviewedBy = 'admin'; 

    await this.agentLearningRepo.save(learning);

    // Embed and store in Vector DB
    const customApiKey = learning.tenant?.settings?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (customApiKey) {
      try {
        const embeddings = new OpenAIEmbeddings({ apiKey: customApiKey, modelName: 'text-embedding-3-small' });
        const vector = await embeddings.embedQuery(learning.learningRule);

        // We use a fake source ID for learnings, normally you'd link it to a system knowledge source
        const SOURCE_ID_LEARNING = '00000000-0000-0000-0000-000000000000';

        // Delete old vector chunk for this learning if it exists
        if (this.vectorSearchService.deleteChunksByMetadata) {
          await this.vectorSearchService.deleteChunksByMetadata(learning.tenantId, 'learningId', learning.id);
        }

        await this.vectorSearchService.storeChunks(
          learning.tenantId,
          SOURCE_ID_LEARNING,
          [
            {
              content: learning.learningRule,
              embedding: vector,
              chunkIndex: 0,
              metadata: {
                sourceType: 'learning',
                category: learning.category,
                learningId: learning.id,
              },
            },
          ]
        );
      } catch (err) {
        console.error('Failed to embed learning:', err);
      }
    }

    return learning;
  }

  async rejectLearning(id: string) {
    const learning = await this.agentLearningRepo.findOne({ where: { id } });
    if (!learning) {
      throw new NotFoundException(`Learning with ID ${id} not found`);
    }

    learning.status = AgentLearningStatus.REJECTED;
    learning.reviewedBy = 'admin';
    await this.agentLearningRepo.save(learning);

    return learning;
  }
}
