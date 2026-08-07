import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { KnowledgeSourceEntity } from './knowledge-source.entity';
import { IndustryEntity } from './industry.entity';

@Entity('knowledge_chunks')
@Index('idx_knowledge_chunks_tenant', ['tenantId'])
@Index('idx_knowledge_chunks_industry', ['industryId'])
export class KnowledgeChunkEntity extends BaseEntity {
  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string;

  @Column({ name: 'industry_id', nullable: true })
  industryId: string;

  @Column({ name: 'source_id' })
  sourceId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'vector', nullable: true, name: 'embedding' })
  embedding: string;

  @Column({ name: 'chunk_index' })
  chunkIndex: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => KnowledgeSourceEntity, (source) => source.chunks)
  @JoinColumn({ name: 'source_id' })
  source: KnowledgeSourceEntity;

  @ManyToOne(() => IndustryEntity, (industry) => industry.knowledgeChunks)
  @JoinColumn({ name: 'industry_id' })
  industry: IndustryEntity;
}
