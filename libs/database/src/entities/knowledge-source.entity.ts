import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';
import { KnowledgeChunkEntity } from './knowledge-chunk.entity';

@Entity('knowledge_sources')
export class KnowledgeSourceEntity extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'source_type', default: 'text' })
  sourceType: string;

  @Column({ nullable: true, name: 'file_path' })
  filePath: string;

  @Column({ nullable: true })
  url: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'chunk_count', default: 0 })
  chunkCount: number;

  @Column({ nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.knowledgeSources)
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @OneToMany(() => KnowledgeChunkEntity, (chunk) => chunk.source)
  chunks: KnowledgeChunkEntity[];
}
