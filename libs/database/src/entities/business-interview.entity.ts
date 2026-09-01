import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';
import { KnowledgeSourceEntity } from './knowledge-source.entity';
import { InterviewResponseEntity } from './interview-response.entity';

@Entity('business_interviews')
@Index('idx_business_interviews_tenant', ['tenantId'])
export class BusinessInterviewEntity extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ default: 'in_progress' })
  status: string;

  @OneToMany(() => InterviewResponseEntity, (r) => r.interview, { cascade: true })
  responses: InterviewResponseEntity[];

  @Column({ type: 'float', default: 0, name: 'overall_score' })
  overallScore: number;

  @Column({ type: 'text', nullable: true, name: 'business_summary' })
  businessSummary: string;

  @Column({ nullable: true, name: 'knowledge_source_id' })
  knowledgeSourceId: string;

  @ManyToOne(() => KnowledgeSourceEntity, { nullable: true })
  @JoinColumn({ name: 'knowledge_source_id' })
  knowledgeSource: KnowledgeSourceEntity;

  @Column({ nullable: true, name: 'previous_interview_id' })
  previousInterviewId: string;

  @Column({ default: 1 })
  version: number;
}
