import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';
import { ConversationEntity } from './conversation.entity';

export enum AgentLearningStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('agent_learnings')
export class AgentLearningEntity extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'conversation_id', nullable: true })
  conversationId: string;

  @Column({ type: 'text', name: 'learning_rule' })
  learningRule: string;

  @Column({
    type: 'enum',
    enum: AgentLearningStatus,
    default: AgentLearningStatus.PENDING,
  })
  status: AgentLearningStatus;

  @Column({ type: 'int', name: 'confidence_score', nullable: true })
  confidenceScore: number;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'text', name: 'original_llm_output', nullable: true })
  originalLLMOutput: string;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @ManyToOne(() => ConversationEntity)
  @JoinColumn({ name: 'conversation_id' })
  conversation: ConversationEntity;
}
