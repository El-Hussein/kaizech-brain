import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';

@Entity('interview_questions')
@Index('idx_interview_questions_tenant', ['tenantId'])
export class InterviewQuestionEntity extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'text', nullable: true, name: 'why_we_need_it' })
  whyWeNeedIt: string;

  @Column({ type: 'jsonb', nullable: true, name: 'suggested_points' })
  suggestedPoints: string[];

  @Column()
  category: string;

  @Column({ default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ default: false, name: 'is_ai_generated' })
  isAiGenerated: boolean;
}
