import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { KnowledgeChunkEntity, TenantEntity } from '@kaizech/database';

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
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  async search(
    tenantId: string,
    queryEmbedding: number[],
    topK: number = 5,
    minSimilarity: number = 0.5,
  ): Promise<VectorSearchResult[]> {
    try {
      const formattedVector = `[${queryEmbedding.join(',')}]`;

      let industryIds: string[] = [];
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
        relations: ['relatedIndustries'],
      });
      if (tenant) {
        if (tenant.mainIndustryId) industryIds.push(tenant.mainIndustryId);
        if (tenant.relatedIndustries?.length) {
          industryIds.push(...tenant.relatedIndustries.map(i => i.id));
        }
      }

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
        WHERE (tenant_id = $2 OR (tenant_id IS NULL AND industry_id = ANY($4::uuid[])))
          AND embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector ASC
        LIMIT $3
        `,
        [formattedVector, tenantId, topK, industryIds],
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
    tenantId: string | null,
    sourceId: string,
    chunks: Array<{ content: string; embedding: number[]; chunkIndex: number; metadata?: Record<string, any> }>,
    industryId?: string | null,
  ): Promise<KnowledgeChunkEntity[]> {
    const entities: KnowledgeChunkEntity[] = [];

    for (const chunk of chunks) {
      const formattedVector = `[${chunk.embedding.join(',')}]`;

      const result = await this.dataSource.query(
        `
        INSERT INTO knowledge_chunks (id, tenant_id, industry_id, source_id, content, embedding, chunk_index, metadata, created_at, updated_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5::vector, $6, $7, NOW(), NOW())
        RETURNING id, tenant_id as "tenantId", industry_id as "industryId", source_id as "sourceId", content, chunk_index as "chunkIndex", created_at as "createdAt";
        `,
        [
          tenantId,
          industryId || null,
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

  async deleteChunksByMetadata(tenantId: string, key: string, value: string): Promise<void> {
    await this.dataSource.query(
      `
      DELETE FROM knowledge_chunks
      WHERE tenant_id = $1 AND metadata->>$2 = $3
      `,
      [tenantId, key, value]
    );
  }

  private faqSourcesCache: Map<string, { hasFaqs: boolean; timestamp: number }> = new Map();
  private faqChunksCache: Map<string, { chunks: any[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 60_000; // 1 minute TTL

  async hasFaqSources(tenantId: string): Promise<boolean> {
    const cached = this.faqSourcesCache.get(tenantId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.hasFaqs;
    }

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
      const hasFaqs = count > 0;
      this.faqSourcesCache.set(tenantId, { hasFaqs, timestamp: Date.now() });
      return hasFaqs;
    } catch (error: any) {
      this.logger.warn(`hasFaqSources check error: ${error.message}`);
      return false;
    }
  }

  async findDirectFaqMatch(tenantId: string, userQuery: string): Promise<VectorSearchResult | null> {
    try {
      const cleanQuery = userQuery.trim().toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, '');
      if (!cleanQuery) return null;

      let rawResults: any[];
      const cachedChunks = this.faqChunksCache.get(tenantId);
      if (cachedChunks && Date.now() - cachedChunks.timestamp < this.CACHE_TTL_MS) {
        rawResults = cachedChunks.chunks;
      } else {
        let industryIds: string[] = [];
        const tenant = await this.tenantRepository.findOne({
          where: { id: tenantId },
          relations: ['relatedIndustries'],
        });
        if (tenant) {
          if (tenant.mainIndustryId) industryIds.push(tenant.mainIndustryId);
          if (tenant.relatedIndustries?.length) {
            industryIds.push(...tenant.relatedIndustries.map(i => i.id));
          }
        }

        rawResults = await this.dataSource.query(
          `
          SELECT 
            c.id, 
            c.source_id as "sourceId", 
            c.content, 
            c.chunk_index as "chunkIndex", 
            c.metadata
          FROM knowledge_chunks c
          LEFT JOIN knowledge_sources s ON c.source_id = s.id
          WHERE (c.tenant_id = $1 OR (c.tenant_id IS NULL AND c.industry_id = ANY($2::uuid[])))
            AND (LOWER(s.source_type) = 'faq' OR LOWER(c.metadata->>'sourceType') = 'faq')
          `,
          [tenantId, industryIds],
        );
        this.faqChunksCache.set(tenantId, { chunks: rawResults, timestamp: Date.now() });
      }

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

      let industryIds: string[] = [];
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
        relations: ['relatedIndustries'],
      });
      if (tenant) {
        if (tenant.mainIndustryId) industryIds.push(tenant.mainIndustryId);
        if (tenant.relatedIndustries?.length) {
          industryIds.push(...tenant.relatedIndustries.map(i => i.id));
        }
      }

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
        WHERE (c.tenant_id = $2 OR (c.tenant_id IS NULL AND c.industry_id = ANY($4::uuid[])))
          AND c.embedding IS NOT NULL
          AND (LOWER(s.source_type) = 'faq' OR LOWER(c.metadata->>'sourceType') = 'faq')
        ORDER BY c.embedding <=> $1::vector ASC
        LIMIT $3
        `,
        [formattedVector, tenantId, topK, industryIds],
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

  async searchLearnings(
    tenantId: string,
    queryEmbedding: number[],
    topK: number = 3,
    minSimilarity: number = 0.60,
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
          AND metadata->>'sourceType' = 'learning'
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
        `Learnings search for tenant '${tenantId}' returned ${filtered.length} matches above threshold ${minSimilarity}`,
      );

      return filtered;
    } catch (error: any) {
      this.logger.error(`Learnings vector search failed: ${error.message}`, error.stack);
      return [];
    }
  }
}
