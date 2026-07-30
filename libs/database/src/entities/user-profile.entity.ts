import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('user_profiles')
@Index('idx_user_profiles_tenant_channel', ['tenantId', 'channelUserId'], { unique: true })
export class UserProfileEntity extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'channel_user_id' })
  channelUserId: string;

  @Column({ name: 'channel_type' })
  channelType: string;

  @Column({ nullable: true, name: 'display_name' })
  displayName: string;

  @Column({ nullable: true, name: 'preferred_language' })
  preferredLanguage: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true, name: 'last_interaction_at' })
  lastInteractionAt: Date;
}
