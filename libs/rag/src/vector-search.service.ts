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

  async hasFaqSources(tenantId: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `
        SELECT COUNT(c.id) as count
        FROM knowledge_chunks c
        LEFT JOIN knowledge_sources s ON c.source_id = s.id
        WHERE c.tenant_id = $1
          AND (LOWER(s.source_type) = 'faq' OR LOWER(c.metadata->>'sourceType') = 'faq')
        `,
        [tenantId],
      );
      const count = parseInt(result?.[0]?.count || '0', 10);
      return count > 0;
    } catch (error: any) {
      this.logger.warn(`hasFaqSources check error: ${error.message}`);
      return false;
    }
  }

  async findDirectFaqMatch(tenantId: string, userQuery: string): Promise<VectorSearchResult | null> {
    try {
      const cleanQuery = userQuery.trim().toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, '');
      if (!cleanQuery) return null;

      const rawResults = await this.dataSource.query(
        `
        SELECT 
          c.id, 
          c.source_id as "sourceId", 
          c.content, 
          c.chunk_index as "chunkIndex", 
          c.metadata
        FROM knowledge_chunks c
        LEFT JOIN knowledge_sources s ON c.source_id = s.id
        WHERE c.tenant_id = $1
          AND (LOWER(s.source_type) = 'faq' OR LOWER(c.metadata->>'sourceType') = 'faq')
        `,
        [tenantId],
      );

      for (const row of rawResults) {
        const content = row.content || '';
        const qMatch = content.match(/Question:\s*([^\n]+)/i);
        if (qMatch && qMatch[1]) {
          const faqQuestion = qMatch[1].trim().toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, '');
          if (
            faqQuestion === cleanQuery ||
            cleanQuery.includes(faqQuestion) ||
            faqQuestion.includes(cleanQuery)
          ) {
            return {
              id: row.id,
              sourceId: row.sourceId,
              content: row.content,
              chunkIndex: row.chunkIndex,
              similarity: 1.0,
              metadata: row.metadata,
            };
          }
        }
      }
      return null;
    } catch (error: any) {
      this.logger.warn(`findDirectFaqMatch error: ${error.message}`);
      return null;
    }
  }

  async searchFaqs(
    tenantId: string,
    queryEmbedding: number[],
    topK: number = 3,
    minSimilarity: number = 0.70,
  ): Promise<VectorSearchResult[]> {
    try {
      const formattedVector = `[${queryEmbedding.join(',')}]`;

      const rawResults = await this.dataSource.query(
        `
        SELECT 
          c.id, 
          c.source_id as "sourceId", 
          c.content, 
          c.chunk_index as "chunkIndex", 
          c.metadata,
          1 - (c.embedding <=> $1::vector) as similarity
        FROM knowledge_chunks c
        LEFT JOIN knowledge_sources s ON c.source_id = s.id
        WHERE c.tenant_id = $2
          AND c.embedding IS NOT NULL
          AND (LOWER(s.source_type) = 'faq' OR LOWER(c.metadata->>'sourceType') = 'faq')
        ORDER BY c.embedding <=> $1::vector ASC
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
        `FAQ search for tenant '${tenantId}' returned ${filtered.length} matches above threshold ${minSimilarity}`,
      );

      return filtered;
    } catch (error: any) {
      this.logger.error(`FAQ vector search failed: ${error.message}`, error.stack);
      return [];
    }
  }
}
