import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { KnowledgeNodeEntity } from './knowledge-node.entity';

@Entity('knowledge_edges')
@Index('idx_knowledge_edges_tenant', ['tenantId'])
export class KnowledgeEdgeEntity extends BaseEntity {
  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string;

  @Column({ name: 'source_node_id' })
  sourceNodeId: string;

  @Column({ name: 'target_node_id' })
  targetNodeId: string;

  @Column({ name: 'relation_type' })
  relationType: string;

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, any>;

  @ManyToOne(() => KnowledgeNodeEntity)
  @JoinColumn({ name: 'source_node_id' })
  sourceNode: KnowledgeNodeEntity;

  @ManyToOne(() => KnowledgeNodeEntity)
  @JoinColumn({ name: 'target_node_id' })
  targetNode: KnowledgeNodeEntity;
}
