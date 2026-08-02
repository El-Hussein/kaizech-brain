import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEventEntity, MessageEntity, ConversationEntity, TenantEntity } from '@kaizech/database';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEventEntity)
    private readonly eventRepository: Repository<AnalyticsEventEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  async trackEvent(
    tenantId: string,
    eventType: string,
    data?: Record<string, any>,
    conversationId?: string,
    channelType?: string,
  ): Promise<AnalyticsEventEntity> {
    const event = this.eventRepository.create({
      tenantId,
      eventType,
      data,
      conversationId,
      channelType,
    });
    return this.eventRepository.save(event);
  }

  async getTenantMetrics(tenantId: string): Promise<Record<string, any>> {
    const totalConversations = await this.conversationRepository.count({
      where: { tenantId },
    });

    const activeConversations = await this.conversationRepository.count({
      where: { tenantId, status: 'active' },
    });

    const handedOffConversations = await this.conversationRepository.count({
      where: { tenantId, status: 'handed_off' },
    });

    const messageCount = await this.messageRepository.count({
      where: { conversation: { tenantId } },
    });

    const tokenStats = await this.messageRepository
      .createQueryBuilder('message')
      .innerJoin('message.conversation', 'conversation')
      .where('conversation.tenantId = :tenantId', { tenantId })
      .select('SUM(message.tokenUsagePrompt)', 'promptTokens')
      .addSelect('SUM(message.tokenUsageCompletion)', 'completionTokens')
      .addSelect('AVG(message.responseTimeMs)', 'avgResponseTimeMs')
      .getRawOne();

    const promptTokens = parseInt(tokenStats?.promptTokens || '0', 10);
    const completionTokens = parseInt(tokenStats?.completionTokens || '0', 10);
    const totalTokens = promptTokens + completionTokens;

    // Estimate cost: GPT-4o approx $2.50/1M input, $10.00/1M output
    const estimatedCostUsd = (promptTokens / 1_000_000) * 2.5 + (completionTokens / 1_000_000) * 10.0;

    const resolutionRate = totalConversations > 0
      ? (((totalConversations - handedOffConversations) / totalConversations) * 100).toFixed(1)
      : '100.0';

    const escalationRate = totalConversations > 0
      ? ((handedOffConversations / totalConversations) * 100).toFixed(1)
      : '0.0';

    return {
      totalConversations,
      activeConversations,
      handedOffConversations,
      totalMessages: messageCount,
      resolutionRate: `${resolutionRate}%`,
      escalationRate: `${escalationRate}%`,
      averageResponseTimeMs: Math.round(parseFloat(tokenStats?.avgResponseTimeMs || '0')),
      tokens: {
        promptTokens,
        completionTokens,
        totalTokens,
        promptPct: totalTokens > 0 ? Math.round((promptTokens / totalTokens) * 100) : 0,
        completionPct: totalTokens > 0 ? Math.round((completionTokens / totalTokens) * 100) : 0,
      },
      estimatedCostUsd: Number(estimatedCostUsd.toFixed(4)),
    };
  }

  async getAgentHealth(tenantId: string): Promise<Record<string, any>> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    const llmProvider = tenant?.settings?.llmProvider || 'OpenAI GPT-4o';
    const vectorStore = tenant?.settings?.vectorStore || 'PostgreSQL pgvector';
    const channels: string[] = tenant?.settings?.enabledChannels || [];

    // Check if WhatsApp has active conversations or credentials configured
    const whatsappConversationsCount = await this.conversationRepository.count({
      where: { tenantId, channelType: 'whatsapp' },
    });

    const isWhatsappConnected =
      channels.includes('whatsapp') ||
      Boolean(
        tenant?.settings?.whatsappAccessToken ||
        tenant?.settings?.whatsappPhoneNumberId ||
        tenant?.settings?.whatsappAppSecret ||
        tenant?.settings?.whatsappVerifyToken
      ) ||
      whatsappConversationsCount > 0;

    // Check agent is "online" by verifying tenant is active
    const isOnline = tenant?.status === 'active';

    return {
      status: isOnline ? 'online' : 'offline',
      tenantName: tenant?.name || 'Unknown',
      tenantSlug: tenant?.slug || '',
      llmProvider,
      vectorStore,
      channels,
      whatsappConnected: isWhatsappConnected,
      webConnected: channels.includes('web') || Boolean(tenant?.apiEndpoint),
      languages: tenant?.languages || ['ar', 'en'],
      timezone: tenant?.timezone || 'Asia/Riyadh',
    };
  }
}
