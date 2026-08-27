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
  BadRequestException,
  Delete,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
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

  private extractSourcesFromMessages(messages: MessageEntity[]) {
    const sources = [];
    for (const msg of messages) {
      if (msg.role === 'assistant' || msg.role === 'ASSISTANT') {
        let metadata = msg.metadata;
        if (typeof metadata === 'string') {
          try { metadata = JSON.parse(metadata); } catch (e) {}
        }
        
        let toolCalls = msg.toolCalls;
        if (typeof toolCalls === 'string') {
          try { toolCalls = JSON.parse(toolCalls); } catch (e) {}
        }

        if (metadata?.knowledgeSources && Array.isArray(metadata.knowledgeSources)) {
          metadata.knowledgeSources.forEach(src => {
            sources.push({ type: 'knowledge', content: src });
          });
        }
        if (metadata?.faqDirectMatch) {
          sources.push({ type: 'faq', similarity: metadata.similarity, messageId: msg.id });
        }
        if (toolCalls && Array.isArray(toolCalls)) {
          for (const tc of toolCalls) {
            if (tc.name === 'vector_search' || tc.name === 'graph_search') {
              if (tc.result && typeof tc.result === 'string') {
                sources.push({ type: tc.name, query: tc.args?.query, content: tc.result });
              } else if (tc.result && Array.isArray(tc.result)) {
                tc.result.forEach((r: any) => {
                  sources.push({ type: tc.name, query: tc.args?.query, content: r.content || r });
                });
              }
            }
          }
        }
      }
    }
    return sources;
  }

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

  @Get('by-user/:channelUserId')
  @ApiOperation({ summary: 'Get conversation details, messages, and limit status by channelUserId / sessionId' })
  async findByChannelUser(
    @TenantContext() tenant: ITenantContext,
    @Param('channelUserId') channelUserId: string,
  ) {
    const conversation = await this.conversationRepo.findOne({
      where: { channelUserId, tenantId: tenant.tenantId },
      order: { createdAt: 'DESC' },
    });

    if (!conversation) {
      throw new NotFoundException(`No conversation found for user '${channelUserId}'`);
    }

    const messages = await this.messageRepo.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'ASC' },
    });

    const tenantEntity = await this.tenantRepo.findOne({ where: { id: tenant.tenantId } });
    const maxLimit =
      typeof conversation.metadata?.maxMessages === 'number'
        ? conversation.metadata.maxMessages
        : typeof tenantEntity?.settings?.maxMessagesPerConversation === 'number'
        ? tenantEntity.settings.maxMessagesPerConversation
        : typeof tenantEntity?.settings?.maxConversationMessages === 'number'
        ? tenantEntity.settings.maxConversationMessages
        : 0;

    return {
      conversation,
      messages,
      sources: this.extractSourcesFromMessages(messages),
      status: conversation.status,
      messageCount: conversation.messageCount || 0,
      limit: maxLimit,
      limitExceeded: maxLimit > 0 && (conversation.messageCount || 0) >= maxLimit,
      handedOff: conversation.status === 'handed_off',
    };
  }

  @Delete('purge')
  @ApiOperation({ summary: 'Purge simulated test data' })
  async purgeSimulatedData(@Req() req: any) {
    const tenantContext = req.tenant;
    
    // Find all simulated conversations for this tenant
    const conversations = await this.conversationRepo.find({
      where: {
        tenantId: tenantContext.tenantId,
        channelUserId: Like('simulated_user_%')
      }
    });

    if (conversations.length === 0) {
      return { purged: 0, message: 'No simulated data found' };
    }

    const conversationIds = conversations.map(c => c.id);

    // Delete associated messages first
    await this.messageRepo.delete({
      conversationId: In(conversationIds)
    });

    // Delete the conversations
    await this.conversationRepo.delete({
      id: In(conversationIds)
    });

    return { purged: conversations.length, message: 'Successfully purged simulated data' };
  }

  @Post('reset-learned')
  @ApiOperation({ summary: 'Reset isLearned for simulated test data' })
  async resetLearned(@Req() req: any) {
    const tenantContext = req.tenant;
    
    const result = await this.conversationRepo.update(
      {
        tenantId: tenantContext.tenantId,
        channelUserId: Like('simulated_user_%')
      },
      { isLearned: false }
    );

    return { resetCount: result.affected || 0, message: 'Successfully reset isLearned flag' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get global conversation statistics' })
  async getStats(@TenantContext() tenant: ITenantContext) {
    const [total, active, handedOff, closed] = await Promise.all([
      this.conversationRepo.count({ where: { tenantId: tenant.tenantId } }),
      this.conversationRepo.count({ where: { tenantId: tenant.tenantId, status: 'active' } }),
      this.conversationRepo.count({ where: { tenantId: tenant.tenantId, status: 'handed_off' } }),
      this.conversationRepo.count({ where: { tenantId: tenant.tenantId, status: 'closed' } }),
    ]);

    return { total, active, handedOff, closed };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation details with messages and limit status' })
  async findOne(
    @TenantContext() tenant: ITenantContext,
    @Param('id') id: string,
  ) {
    let conversation = await this.conversationRepo.findOne({
      where: { id, tenantId: tenant.tenantId },
    });

    if (!conversation) {
      conversation = await this.conversationRepo.findOne({
        where: { id },
      });
    }

    if (!conversation) {
      throw new NotFoundException(`Conversation with id '${id}' not found`);
    }

    const messages = await this.messageRepo.find({
      where: { conversationId: id },
      order: { createdAt: 'ASC' },
    });

    const tenantEntity = await this.tenantRepo.findOne({ where: { id: tenant.tenantId } });
    const maxLimit =
      typeof conversation.metadata?.maxMessages === 'number'
        ? conversation.metadata.maxMessages
        : typeof tenantEntity?.settings?.maxMessagesPerConversation === 'number'
        ? tenantEntity.settings.maxMessagesPerConversation
        : typeof tenantEntity?.settings?.maxConversationMessages === 'number'
        ? tenantEntity.settings.maxConversationMessages
        : 0;

    return {
      conversation,
      messages,
      sources: this.extractSourcesFromMessages(messages),
      status: conversation.status,
      messageCount: conversation.messageCount || 0,
      limit: maxLimit,
      limitExceeded: maxLimit > 0 && (conversation.messageCount || 0) >= maxLimit,
      handedOff: conversation.status === 'handed_off',
    };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a message to a conversation thread' })
  async addMessage(
    @TenantContext() tenant: ITenantContext,
    @Param('id') id: string,
    @Body() body: { role: string; content: string; channelType?: string },
  ) {
    let conversation = await this.conversationRepo.findOne({
      where: { id, tenantId: tenant.tenantId },
    });

    if (!conversation) {
      conversation = await this.conversationRepo.findOne({
        where: { id },
      });
    }

    if (!conversation) {
      throw new NotFoundException(`Conversation with id '${id}' not found`);
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

  @Post(':id/satisfaction')
  @ApiOperation({ summary: 'Submit user satisfaction rating for a conversation' })
  async submitSatisfaction(
    @TenantContext() tenant: ITenantContext,
    @Param('id') id: string,
    @Body() body: { score: number; feedback?: string; tags?: string[] },
  ) {
    if (body.score < 1 || body.score > 5) {
      throw new BadRequestException('Satisfaction score must be between 1 and 5');
    }

    let conversation = await this.conversationRepo.findOne({
      where: { id, tenantId: tenant.tenantId },
    });

    if (!conversation) {
      conversation = await this.conversationRepo.findOne({
        where: { id },
      });
    }

    if (!conversation) {
      throw new NotFoundException(`Conversation with id '${id}' not found`);
    }

    conversation.satisfactionScore = body.score;
    conversation.satisfactionFeedback = body.feedback || '';
    
    if (body.tags && body.tags.length > 0) {
      conversation.metadata = {
        ...(conversation.metadata || {}),
        feedbackTags: body.tags,
      };
    }

    conversation.isLearned = false; // Mark for extraction by the cron job
    await this.conversationRepo.save(conversation);

    return { success: true, conversationId: id, score: body.score };
  }

  @Patch(':id/limit')
  @ApiOperation({ summary: 'Update per-conversation message limit (0 = unlimited)' })
  async updateLimit(
    @TenantContext() tenant: ITenantContext,
    @Param('id') id: string,
    @Body() body: { maxMessages: number },
  ) {
    let conversation = await this.conversationRepo.findOne({
      where: { id, tenantId: tenant.tenantId },
    });

    if (!conversation) {
      conversation = await this.conversationRepo.findOne({
        where: { id },
      });
    }

    if (!conversation) {
      throw new NotFoundException(`Conversation with id '${id}' not found`);
    }

    const limit = typeof body.maxMessages === 'number' && body.maxMessages >= 0 ? body.maxMessages : 0;
    conversation.metadata = {
      ...(conversation.metadata || {}),
      maxMessages: limit,
    };

    // If newly set limit is less than or equal to current messageCount, transition to handed_off
    if (limit > 0 && (conversation.messageCount || 0) >= limit && conversation.status === 'active') {
      conversation.status = 'handed_off';
    }

    await this.conversationRepo.save(conversation);

    return {
      conversation,
      limit,
      messageCount: conversation.messageCount || 0,
      limitExceeded: limit > 0 && (conversation.messageCount || 0) >= limit,
      status: conversation.status,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update conversation status (active, handed_off, closed)' })
  async updateStatus(
    @TenantContext() tenant: ITenantContext,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    let conversation = await this.conversationRepo.findOne({
      where: { id, tenantId: tenant.tenantId },
    });

    if (!conversation) {
      conversation = await this.conversationRepo.findOne({
        where: { id },
      });
    }

    if (!conversation) {
      return { id, status: body.status };
    }

    if (body.status === 'active') {
      const maxLimit = conversation.metadata?.maxMessages || 0;
      if (maxLimit > 0 && (conversation.messageCount || 0) >= maxLimit) {
        throw new BadRequestException(
          `Cannot resume AI mode: message limit (${conversation.messageCount}/${maxLimit}) has been reached. Please increase the message limit first.`,
        );
      }
    }

    conversation.status = body.status;
    await this.conversationRepo.save(conversation);

    return conversation;
  }

  @Post(':id/handoff')
  @ApiOperation({ summary: 'Pause AI and trigger human handoff for a specific conversation ID' })
  async triggerHandoff(
    @TenantContext() tenant: ITenantContext,
    @Param('id') id: string,
    @Body() body: { reason?: string; notice?: string },
  ) {
    let conversation = await this.conversationRepo.findOne({
      where: { id, tenantId: tenant.tenantId },
    });

    if (!conversation) {
      conversation = await this.conversationRepo.findOne({
        where: { id },
      });
    }

    if (!conversation) {
      throw new NotFoundException(`Conversation with id '${id}' not found`);
    }

    conversation.status = 'handed_off';
    await this.conversationRepo.save(conversation);

    const tenantEntity = await this.tenantRepo.findOne({ where: { id: tenant.tenantId } });
    const handoffNotice =
      body.notice ||
      tenantEntity?.settings?.handoffMessage ||
      '⚠️ Conversation handed off to human support.';

    const systemMsg = this.messageRepo.create({
      conversationId: id,
      role: 'system',
      content: handoffNotice,
      channelType: conversation.channelType || 'api',
    });
    await this.messageRepo.save(systemMsg);

    return {
      success: true,
      message: 'Conversation handed off successfully',
      conversationId: id,
      status: 'handed_off',
      handedOff: true,
      reason: body.reason || 'MANUAL_CLIENT_HANDOFF',
    };
  }
}

