import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('tickets')
export class TicketEntity extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @Column({ default: 'open' })
  status: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true, name: 'assigned_to' })
  assignedTo: string;

  @Column({ nullable: true })
  priority: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true, name: 'resolved_at' })
  resolvedAt: Date;
}
