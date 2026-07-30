import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';

@Entity('api_keys')
export class ApiKeyEntity extends BaseEntity {
  @Column({ name: 'key_hash', unique: true })
  keyHash: string;

  @Column({ name: 'key_prefix' })
  keyPrefix: string;

  @Column()
  name: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @Column({ nullable: true, name: 'last_used_at' })
  lastUsedAt: Date;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.apiKeys)
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;
}
