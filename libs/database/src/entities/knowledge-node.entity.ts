import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('knowledge_nodes')
@Index('idx_knowledge_nodes_tenant', ['tenantId'])
@Index('idx_knowledge_nodes_name', ['name'])
export class KnowledgeNodeEntity extends BaseEntity {
  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'type', nullable: true })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, any>;
}
