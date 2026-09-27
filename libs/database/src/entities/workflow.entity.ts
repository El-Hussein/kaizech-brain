import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import type { TenantEntity } from './tenant.entity';

@Entity('workflows')
@Index(['tenant_id'])
export class WorkflowEntity extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text', array: true, default: '{}' })
  triggerKeywords: string[];

  @Column({ type: 'text', nullable: true })
  semanticIntent: string;

  @Column({ type: 'jsonb', default: [] })
  nodes: any[];

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: true })
  isDraft: boolean;

  @Column({ type: 'int', default: 0 })
  executionCount: number;

  @Column({ type: 'int', default: 0 })
  completionCount: number;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  @ManyToOne('TenantEntity', 'workflows', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;
}
