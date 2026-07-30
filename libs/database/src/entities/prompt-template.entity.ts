import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';

@Entity('prompt_templates')
export class PromptTemplateEntity extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  identity: string;

  @Column({ type: 'text', nullable: true, name: 'business_rules' })
  businessRules: string;

  @Column({ type: 'text', nullable: true, name: 'safety_rules' })
  safetyRules: string;

  @Column({ type: 'text', nullable: true, name: 'custom_instructions' })
  customInstructions: string;

  @Column({ type: 'text', nullable: true })
  tone: string;

  @Column({ type: 'simple-array', nullable: true })
  restrictions: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.promptTemplates)
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;
}
