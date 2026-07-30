import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';

@Entity('tool_manifests')
export class ToolManifestEntity extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  parameters: Record<string, any>;

  @Column({ name: 'api_endpoint' })
  apiEndpoint: string;

  @Column({ name: 'http_method', default: 'POST' })
  httpMethod: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ nullable: true, name: 'auth_type' })
  authType: string;

  @Column({ nullable: true, name: 'auth_config', type: 'jsonb' })
  authConfig: Record<string, any>;

  @Column({ default: 30000, name: 'timeout_ms' })
  timeoutMs: number;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.toolManifests)
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;
}
