import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TenantEntity } from './tenant.entity';
import { MessageEntity } from './message.entity';

@Entity('conversations')
export class ConversationEntity extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'channel_type' })
  channelType: string;

  @Column({ name: 'channel_user_id' })
  channelUserId: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  summary: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  language: string;

  @Column({ name: 'message_count', default: 0 })
  messageCount: number;

  @Column({ nullable: true, name: 'last_message_at' })
  lastMessageAt: Date;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.conversations)
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @OneToMany(() => MessageEntity, (msg) => msg.conversation)
  messages: MessageEntity[];
}
