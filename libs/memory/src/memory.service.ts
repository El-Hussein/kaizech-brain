import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity, MessageEntity } from '@kaizech/database';
import { ChatMessage, ConversationStatus } from '@kaizech/shared';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  async getOrCreateConversation(
    tenantId: string,
    channelType: string,
    channelUserId: string,
  ): Promise<ConversationEntity> {
    let conversation = await this.conversationRepository.findOne({
      where: {
        tenantId,
        channelType,
        channelUserId,
      },
      order: { createdAt: 'DESC' },
    });

    if (!conversation || conversation.status === ConversationStatus.CLOSED) {
      conversation = this.conversationRepository.create({
        tenantId,
        channelType,
        channelUserId,
        status: ConversationStatus.ACTIVE,
        messageCount: 0,
        lastMessageAt: new Date(),
      });
      conversation = await this.conversationRepository.save(conversation);
      this.logger.log(`Created new conversation ${conversation.id} for user ${channelUserId}`);
    }

    return conversation;
  }

  async findConversation(
    tenantId: string,
    idOrSessionId: string,
  ): Promise<ConversationEntity | null> {
    let conversation = await this.conversationRepository.findOne({
      where: { id: idOrSessionId, tenantId },
    });
    if (!conversation) {
      conversation = await this.conversationRepository.findOne({
        where: { channelUserId: idOrSessionId, tenantId },
        order: { createdAt: 'DESC' },
      });
    }
    return conversation;
  }

  async addMessage(
    conversationId: string,
    role: string,
    content: string,
    channelType: string,
    options?: {
      toolCalls?: any[];
      toolResult?: any;
      tokenUsagePrompt?: number;
      tokenUsageCompletion?: number;
      responseTimeMs?: number;
      metadata?: Record<string, any>;
    },
  ): Promise<MessageEntity> {
    const message = this.messageRepository.create({
      conversationId,
      role,
      content,
      channelType,
      toolCalls: options?.toolCalls,
      toolResult: options?.toolResult,
      tokenUsagePrompt: options?.tokenUsagePrompt,
      tokenUsageCompletion: options?.tokenUsageCompletion,
      responseTimeMs: options?.responseTimeMs,
      metadata: options?.metadata,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation metrics
    await this.conversationRepository.increment(
      { id: conversationId },
      'messageCount',
      1,
    );
    await this.conversationRepository.update(conversationId, {
      lastMessageAt: new Date(),
    });

    return savedMessage;
  }

  async getRecentMessages(
    conversationId: string,
    limit: number = 10,
  ): Promise<ChatMessage[]> {
    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Reverse to get chronological order
    const sorted = messages.reverse();

    return sorted.map((msg) => ({
      role: msg.role as any,
      content: msg.content,
      toolCallId: msg.metadata?.toolCallId,
      toolCalls: msg.toolCalls,
    }));
  }

  async getConversationSummary(conversationId: string): Promise<string | null> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      select: ['summary'],
    });
    return conversation?.summary || null;
  }

  async updateConversationSummary(
    conversationId: string,
    summary: string,
  ): Promise<void> {
    await this.conversationRepository.update(conversationId, { summary });
  }

  async closeConversation(conversationId: string): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      status: ConversationStatus.CLOSED,
    });
  }

  async handoverConversation(conversationId: string): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      status: ConversationStatus.HANDED_OFF,
    });
  }
}
