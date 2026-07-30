import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('analytics_events')
@Index('idx_analytics_tenant_type', ['tenantId', 'eventType'])
export class AnalyticsEventEntity extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ nullable: true, name: 'conversation_id' })
  conversationId: string;

  @Column({ nullable: true, name: 'channel_type' })
  channelType: string;
}
