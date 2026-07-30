import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ConversationEntity } from './conversation.entity';

@Entity('messages')
export class MessageEntity extends BaseEntity {
  @Column({ name: 'conversation_id' })
  conversationId: string;

  @Column()
  role: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'channel_type' })
  channelType: string;

  @Column({ type: 'jsonb', nullable: true, name: 'tool_calls' })
  toolCalls: any[];

  @Column({ type: 'jsonb', nullable: true, name: 'tool_result' })
  toolResult: any;

  @Column({ nullable: true, name: 'token_usage_prompt' })
  tokenUsagePrompt: number;

  @Column({ nullable: true, name: 'token_usage_completion' })
  tokenUsageCompletion: number;

  @Column({ nullable: true, name: 'response_time_ms' })
  responseTimeMs: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => ConversationEntity, (conv) => conv.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: ConversationEntity;
}
