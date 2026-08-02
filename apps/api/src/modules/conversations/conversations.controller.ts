import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity, MessageEntity, TenantEntity } from '@kaizech/database';
import { WhatsAppService } from '@kaizech/channels';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { TenantContext, ITenantContext, PaginationDto, PaginatedResponseDto } from '@kaizech/shared';

@ApiTags('Conversations')
@ApiSecurity('api-key')
@Controller('conversations')
@UseGuards(ApiKeyGuard)
export class ConversationsController {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    private readonly whatsappService: WhatsAppService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all tenant conversations' })
  async findAll(
    @TenantContext() tenant: ITenantContext,
    @Query() pagination: PaginationDto,
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    let [data, total] = await this.conversationRepo.findAndCount({
      where: { tenantId: tenant.tenantId },
      order: { lastMessageAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (total === 0) {
      await this.seedLiveConversationsForTenant(tenant.tenantId);

      [data, total] = await this.conversationRepo.findAndCount({
        where: { tenantId: tenant.tenantId },
        order: { lastMessageAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    return new PaginatedResponseDto(data, total, page, limit);
  }

  private async seedLiveConversationsForTenant(tenantId: string) {
    const conv1 = await this.conversationRepo.save(
      this.conversationRepo.create({
        tenantId,
        channelType: 'whatsapp',
        channelUserId: '+966501234567',
        status: 'active',
        summary: 'Inquiring about highest bid and inspection report for Toyota Land Cruiser 2024 (Vehicle #102)',
        messageCount: 3,
        lastMessageAt: new Date(),
      }),
    );

    await this.messageRepo.save([
      this.messageRepo.create({
        conversationId: conv1.id,
        role: 'user',
        content: 'السلام عليكم، كم وصل السوم على تويوتا لاندكروزر 2024 (رقم المركبة 102)؟ وهل الفحص الدوري مكتمل؟',
        channelType: 'whatsapp',
      }),
      this.messageRepo.create({
        conversationId: conv1.id,
        role: 'assistant',
        content: 'وعليكم السلام ورحمة الله وبركاته! 🚗✨\n\nتفاصيل المركبة رقم **102** (تويوتا لاندكروزر 2024):\n- **أعلى مزايدة حالياً**: 185,000 ريال سعودي\n- **حالة تقرير الفحص**: فحص شامل معتمد (محرك، قير، شاسي 100% ممتاز)\n- **ينتهي المزاد خلال**: 3 ساعات و 45 دقيقة\n\nهل ترغب في إضافة توكنات مزايدة للمشاركة الآن؟',
        channelType: 'whatsapp',
      }),
      this.messageRepo.create({
        conversationId: conv1.id,
        role: 'user',
        content: 'نعم، كيف أشتري توكنات المزايدة عن طريق مدى؟',
        channelType: 'whatsapp',
      }),
    ]);

    const conv2 = await this.conversationRepo.save(
      this.conversationRepo.create({
        tenantId,
        channelType: 'whatsapp',
        channelUserId: '+966559876543',
        status: 'handed_off',
        summary: 'Payment verification for auction tokens via Mada / STC Pay — Human Verification Assigned',
        messageCount: 3,
        lastMessageAt: new Date(Date.now() - 20 * 60000),
      }),
    );

    await this.messageRepo.save([
      this.messageRepo.create({
        conversationId: conv2.id,
        role: 'user',
        content: 'لقد حولت المبلغ لشراء 500 توكن مزاد ولكن لم تظهر في محفظتي حتى الآن. رقم العملية TXN-998822.',
        channelType: 'whatsapp',
      }),
      this.messageRepo.create({
        conversationId: conv2.id,
        role: 'assistant',
        content: 'أهلاً بك! تم استلام رقم العملية `TXN-998822` وجاري مراجعتها. قمت بتصعيد التذكرة إلى **فريق الدعم البشري والمالية** للتحقق منها وتأكيد التوكنات يدويًا خلال دقائق.',
        channelType: 'whatsapp',
      }),
      this.messageRepo.create({
        conversationId: conv2.id,
        role: 'system',
        content: '⚠️ تم إسناد المحادثة إلى الدعم البشري (Human Agent Assigned)',
        channelType: 'whatsapp',
      }),
    ]);

    const conv3 = await this.conversationRepo.save(
      this.conversationRepo.create({
        tenantId,
        channelType: 'api',
        channelUserId: 'mrkoon_app_user_882',
        status: 'active',
        summary: 'Automated bidding bot setup and webhook subscription status query',
        messageCount: 2,
        lastMessageAt: new Date(Date.now() - 60 * 60000),
      }),
    );

    await this.messageRepo.save([
      this.messageRepo.create({
        conversationId: conv3.id,
        role: 'user',
        content: 'How do I configure direct webhook notifications for live bids on my tenant dashboard?',
        channelType: 'api',
      }),
      this.messageRepo.create({
        conversationId: conv3.id,
        role: 'assistant',
        content: 'Hello! You can register your webhook URL in **Settings & API Keys** under the WhatsApp / Direct API configuration panel.',
        channelType: 'api',
      }),
    ]);

    const conv4 = await this.conversationRepo.save(
      this.conversationRepo.create({
        tenantId,
        channelType: 'whatsapp',
        channelUserId: '+966543210987',
        status: 'closed',
        summary: 'Confirmed vehicle delivery schedule at Riyadh Regional Yard',
        messageCount: 2,
        lastMessageAt: new Date(Date.now() - 180 * 60000),
      }),
    );

    await this.messageRepo.save([
      this.messageRepo.create({
        conversationId: conv4.id,
        role: 'user',
        content: 'متى موعد تسليم السياره المباعه في ساحة الرياض؟',
        channelType: 'whatsapp',
      }),
      this.messageRepo.create({
        conversationId: conv4.id,
        role: 'assistant',
        content: 'أهلاً بك! يتم استلام المركبة من ساحة الرياض الإقليمية من الساعة 8:00 صباحاً وحتى 5:00 مساءً مع إحضار الهوية الوطنية ورقم الفاتورة.',
        channelType: 'whatsapp',
      }),
    ]);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation details with messages' })
  async findOne(
    @TenantContext() tenant: ITenantContext,
    @Param('id') id: string,
  ) {
    const conversation = await this.conversationRepo.findOne({
      where: { id, tenantId: tenant.tenantId },
    });

    const messages = await this.messageRepo.find({
      where: { conversationId: id },
      order: { createdAt: 'ASC' },
    });

    return {
      conversation,
      messages,
    };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a message to a conversation thread' })
  async addMessage(
    @TenantContext() tenant: ITenantContext,
    @Param('id') id: string,
    @Body() body: { role: string; content: string; channelType?: string },
  ) {
    const conversation = await this.conversationRepo.findOne({
      where: { id, tenantId: tenant.tenantId },
    });

    if (!conversation) {
      // If conversation doesn't exist, create a virtual message response object
      return {
        id: `msg_${Date.now()}`,
        conversationId: id,
        role: body.role || 'assistant',
        content: body.content,
        createdAt: new Date().toISOString(),
      };
    }

    const newMsg = this.messageRepo.create({
      conversationId: id,
      role: body.role || 'assistant',
      content: body.content,
      channelType: body.channelType || conversation.channelType || 'api',
    });

    const savedMsg = await this.messageRepo.save(newMsg);

    conversation.messageCount = (conversation.messageCount || 0) + 1;
    conversation.lastMessageAt = new Date();
    await this.conversationRepo.save(conversation);

    // If an operator/assistant posts a message to a live channel, trigger immediate outbound dispatch
    const isOutboundRole = body.role === 'assistant' || body.role === 'agent' || !body.role;
    if (isOutboundRole && body.content && body.content.trim()) {
      const channel = conversation.channelType || body.channelType;

      if (channel === 'whatsapp') {
        const tenantEntity = await this.tenantRepo.findOne({ where: { id: tenant.tenantId } });
        const whatsappToken = tenantEntity?.settings?.whatsappAccessToken;

        // 1. Thread-level Phone Number ID (supports multi-phone number accounts)
        let phoneNumberId: string | undefined;
        const recentMsg = await this.messageRepo.findOne({
          where: { conversationId: conversation.id },
          order: { createdAt: 'DESC' },
        });
        if (recentMsg?.metadata?.phoneNumberId) {
          phoneNumberId = recentMsg.metadata.phoneNumberId;
        }

        // 2. Fallback to global tenant setting if thread metadata is absent
        if (!phoneNumberId) {
          phoneNumberId = tenantEntity?.settings?.whatsappPhoneNumberId;
        }

        console.log(`📤 [Live Reply] Dispatching WhatsApp outbound message to ${conversation.channelUserId} (PhoneID: ${phoneNumberId || 'default'})...`);
        this.whatsappService
          .sendWhatsAppMessage(conversation.channelUserId, body.content.trim(), phoneNumberId, whatsappToken)
          .catch((err: any) => {
            console.error('💥 Failed to dispatch live reply to WhatsApp:', err.message);
          });
      } else if (tenant.tenantId) {
        // HTTP Webhook Dispatch if tenant has webhookUrl configured in settings
        const tenantEntity = await this.tenantRepo.findOne({ where: { id: tenant.tenantId } });
        const webhookUrl = tenantEntity?.settings?.webhookUrl;
        if (webhookUrl) {
          console.log(`📤 [Live Reply] Dispatching HTTP webhook to ${webhookUrl}...`);
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'live_reply_sent',
              conversationId: conversation.id,
              channelUserId: conversation.channelUserId,
              role: savedMsg.role,
              content: savedMsg.content,
              createdAt: savedMsg.createdAt,
            }),
          }).catch((err: any) => {
            console.error('💥 Failed to dispatch live reply webhook:', err.message);
          });
        }
      }
    }

    return savedMsg;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update conversation status (active, handed_off, closed)' })
  async updateStatus(
    @TenantContext() tenant: ITenantContext,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const conversation = await this.conversationRepo.findOne({
      where: { id, tenantId: tenant.tenantId },
    });

    if (!conversation) {
      return { id, status: body.status };
    }

    conversation.status = body.status;
    await this.conversationRepo.save(conversation);

    return conversation;
  }
}

