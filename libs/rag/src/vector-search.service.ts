import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { KnowledgeChunkEntity } from '@kaizech/database';

export interface VectorSearchResult {
  id: string;
  sourceId: string;
  content: string;
  chunkIndex: number;
  similarity: number;
  metadata: Record<string, any>;
}

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(KnowledgeChunkEntity)
    private readonly chunkRepository: Repository<KnowledgeChunkEntity>,
  ) {}

  async search(
    tenantId: string,
    queryEmbedding: number[],
    topK: number = 5,
    minSimilarity: number = 0.5,
  ): Promise<VectorSearchResult[]> {
    try {
      const formattedVector = `[${queryEmbedding.join(',')}]`;

      const rawResults = await this.dataSource.query(
        `
        SELECT 
          id, 
          source_id as "sourceId", 
          content, 
          chunk_index as "chunkIndex", 
          metadata,
          1 - (embedding <=> $1::vector) as similarity
        FROM knowledge_chunks
        WHERE tenant_id = $2
          AND embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector ASC
        LIMIT $3
        `,
        [formattedVector, tenantId, topK],
      );

      const filtered = rawResults
        .filter((row: any) => parseFloat(row.similarity) >= minSimilarity)
        .map((row: any) => ({
          id: row.id,
          sourceId: row.sourceId,
          content: row.content,
          chunkIndex: row.chunkIndex,
          similarity: parseFloat(row.similarity),
          metadata: row.metadata,
        }));

      this.logger.debug(
        `Vector search for tenant '${tenantId}' returned ${filtered.length} chunks above threshold ${minSimilarity}`,
      );

      return filtered;
    } catch (error: any) {
      this.logger.error(`Vector search failed: ${error.message}`, error.stack);
      return [];
    }
  }

  async storeChunks(
    tenantId: string,
    sourceId: string,
    chunks: Array<{ content: string; embedding: number[]; chunkIndex: number; metadata?: Record<string, any> }>,
  ): Promise<KnowledgeChunkEntity[]> {
    const entities: KnowledgeChunkEntity[] = [];

    for (const chunk of chunks) {
      const formattedVector = `[${chunk.embedding.join(',')}]`;

      const result = await this.dataSource.query(
        `
        INSERT INTO knowledge_chunks (id, tenant_id, source_id, content, embedding, chunk_index, metadata, created_at, updated_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4::vector, $5, $6, NOW(), NOW())
        RETURNING id, tenant_id as "tenantId", source_id as "sourceId", content, chunk_index as "chunkIndex", created_at as "createdAt";
        `,
        [
          tenantId,
          sourceId,
          chunk.content,
          formattedVector,
          chunk.chunkIndex,
          JSON.stringify(chunk.metadata || {}),
        ],
      );

      if (result && result[0]) {
        entities.push(result[0]);
      }
    }

    return entities;
  }
}
