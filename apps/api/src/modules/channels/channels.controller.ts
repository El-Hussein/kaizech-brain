import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { WhatsAppService, MetaSignatureGuard } from '@kaizech/channels';
import { AgentOrchestratorService } from '@kaizech/agent';
import { MemoryService } from '@kaizech/memory';
import { TenantsService } from '../tenants/tenants.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { MessageChannel } from '@kaizech/shared';
import { Response } from 'express';

// ─────────────────────────────────────────────────────
// Channel 1: WhatsApp Direct (Meta Webhook)
// Auth: X-Hub-Signature-256 HMAC (validated by MetaSignatureGuard)
// Meta calls these endpoints directly.
// ─────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────
// Channel 2: Direct API (Apps / Mrkoon-Meta service)
// Auth: x-api-key header (validated by ApiKeyGuard)
// Any client (website, app, Mrkoon-Meta bridge) calls POST /chat.
// ─────────────────────────────────────────────────────

@ApiTags('Channels')
@Controller('channels')
export class ChannelsController {
  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly tenantsService: TenantsService,
    private readonly agentOrchestrator: AgentOrchestratorService,
    private readonly memoryService: MemoryService,
  ) {}

  // ─── Channel 1: WhatsApp via Meta ─────────────────

  /**
   * Meta calls this once to verify the webhook URL is valid.
   * No auth needed — Meta sends the verify_token we configured.
   */
  @Get(['whatsapp/webhook', 'whatsapp/webhook/:tenantId'])
  @ApiOperation({ summary: 'WhatsApp Webhook Verification (Meta handshake)' })
  verifyWhatsAppWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.whatsappService.verifyWebhook(mode, token, challenge);
  }

  /**
   * Meta calls this for every incoming WhatsApp message.
   * Protected by MetaSignatureGuard: validates X-Hub-Signature-256 HMAC
   * to ensure the payload genuinely comes from Meta and not a spoofed source.
   */
  @Post('whatsapp/webhook')
  @UseGuards(MetaSignatureGuard)
  @ApiOperation({ summary: 'WhatsApp Incoming Message (secured by Meta HMAC signature)' })
  handleWhatsAppIncomingRoot(@Body() payload: any) {
    console.log('📥 [WhatsApp Webhook POST Received]:', JSON.stringify(payload, null, 2));

    // Process asynchronously so HTTP 200 is returned immediately to Meta (prevents retries)
    this.tenantsService
      .findAll()
      .then((tenants) => {
        const tenant =
          tenants.find((t) => t.slug === 'mrkoon' || t.slug === 'mrkoon-auctions') ||
          tenants.find((t) => t.slug.includes('mrkoon')) ||
          tenants[0];
        if (tenant) {
          this.whatsappService.handleIncomingPayload(payload, tenant).catch((err) => {
            console.error('💥 Background WhatsApp processing error:', err.message);
          });
        }
      })
      .catch((err) => console.error('💥 Tenant lookup error in WhatsApp webhook:', err.message));

    return { status: 'EVENT_RECEIVED' };
  }

  @Post('whatsapp/webhook/:tenantId')
  @UseGuards(MetaSignatureGuard)
  @ApiOperation({ summary: 'WhatsApp Incoming Message with Tenant ID' })
  handleWhatsAppIncomingTenant(
    @Param('tenantId') tenantId: string,
    @Body() payload: any,
  ) {
    console.log('📥 [WhatsApp Webhook POST Received for Tenant]:', tenantId, JSON.stringify(payload, null, 2));

    this.tenantsService
      .findOne(tenantId)
      .then((tenant) => {
        if (tenant) {
          this.whatsappService.handleIncomingPayload(payload, tenant).catch((err) => {
            console.error('💥 Background WhatsApp processing error:', err.message);
          });
        }
      })
      .catch((err) => console.error('💥 Tenant lookup error in WhatsApp webhook:', err.message));

    return { status: 'EVENT_RECEIVED' };
  }

  @Post('whatsapp/test')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Test live WhatsApp Meta Graph API connection and credentials' })
  async testWhatsAppConnection(@Req() req: any) {
    const tenantContext = req.tenant;
    const tenant = await this.tenantsService.findOne(tenantContext.tenantId);
    return this.whatsappService.testConnection(tenant);
  }

  // ─── Channel 2: Direct API / Mrkoon-Meta ──────────

  /**
   * Entry point for any direct API client: apps, websites, or the
   * Mrkoon-Meta bridge service.
   *
   * Protected by ApiKeyGuard: validates x-api-key header, resolves the
   * correct tenant, and injects request.tenant for downstream use.
   *
   * Mrkoon-Meta flow:
   *   Customer → Meta → Mrkoon-Meta → POST /chat (x-api-key) → AI reply JSON
   *
   * Direct API flow:
   *   App/Website → POST /chat (x-api-key) → AI reply JSON
   */
  @Post('chat')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Send a message and receive an AI reply (API Key auth)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['message', 'sessionId'],
      properties: {
        message: { type: 'string', example: 'What is the current bid for auction #42?' },
        sessionId: { type: 'string', example: 'user-abc-123' },
        channel: {
          type: 'string',
          enum: ['api', 'whatsapp', 'web'],
          default: 'api',
          example: 'api',
        },
        displayName: { type: 'string', example: 'Ahmed Al-Mansouri' },
      },
    },
  })
  async chat(
    @Req() req: any,
    @Body() body: { message: string; sessionId: string; channel?: string; displayName?: string },
  ) {
    const tenantContext = req.tenant; // injected by ApiKeyGuard

    if (!body.message || !body.message.trim()) {
      return {
        reply: null,
        sessionId: body.sessionId,
        tenantId: tenantContext?.tenantId ?? null,
        skipped: true,
        reason: 'Message content is empty',
      };
    }

    const tenant = await this.tenantsService.findOne(tenantContext.tenantId);

    const channelType =
      body.channel === 'whatsapp'
        ? MessageChannel.WHATSAPP
        : MessageChannel.API;

    const result = await this.agentOrchestrator.processMessage({
      tenant,
      channelType,
      channelUserId: body.sessionId,
      userMessage: body.message.trim(),
      displayName: body.displayName ?? body.sessionId,
      metadata: { apiKeyId: tenantContext.apiKeyId },
    });

    return {
      reply: result.response,
      sessionId: body.sessionId,
      conversationId: result.conversationId,
      tenantId: tenantContext.tenantId,
      status: result.status,
      limit: result.limit ?? 0,
      messageCount: result.messageCount ?? 0,
      limitExceeded: result.limitExceeded ?? false,
      handedOff: result.handedOff ?? false,
      tokens: result.tokenUsage?.totalTokens ?? null,
    };
  }

  @Post('chat-stream')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Stream AI assistant reply (SSE format)' })
  async chatStream(
    @Req() req: any,
    @Body() body: { message: string; sessionId: string; channel?: string; displayName?: string },
    @Res() res: Response,
  ) {
    const tenantContext = req.tenant;

    if (!body.message || !body.message.trim()) {
      (res as any).status(400).json({ error: 'Message content is empty' });
      return;
    }

    const tenant = await this.tenantsService.findOne(tenantContext.tenantId);
    const channelType =
      body.channel === 'whatsapp'
        ? MessageChannel.WHATSAPP
        : MessageChannel.API;

    (res as any).setHeader('Content-Type', 'text/event-stream');
    (res as any).setHeader('Cache-Control', 'no-cache');
    (res as any).setHeader('Connection', 'keep-alive');
    (res as any).setHeader('X-Accel-Buffering', 'no');

    const result = await this.agentOrchestrator.processMessageStream(
      {
        tenant,
        channelType,
        channelUserId: body.sessionId,
        userMessage: body.message.trim(),
        displayName: body.displayName ?? body.sessionId,
        metadata: { apiKeyId: tenantContext.apiKeyId },
      },
      (chunk: string) => {
        (res as any).write(`data: ${JSON.stringify({ chunk })}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      },
    );

    (res as any).write(`data: ${JSON.stringify({ event: 'DONE', meta: result })}\n\n`);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
    (res as any).end();
  }

  @Post('handoff')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Pause AI and trigger human handoff directly from client' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'user-abc-123' },
        conversationId: { type: 'string', example: '8f1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c' },
        reason: { type: 'string', example: 'client_requested' },
        notice: { type: 'string', example: 'Transferred to live human agent by client app request.' },
      },
    },
  })
  async handoff(
    @Req() req: any,
    @Body() body: { sessionId?: string; conversationId?: string; reason?: string; notice?: string },
  ) {
    const tenantContext = req.tenant;
    const identifier = body.conversationId || body.sessionId;

    if (!identifier) {
      throw new BadRequestException('Either sessionId or conversationId must be provided in request body');
    }

    const conversation = await this.memoryService.findConversation(tenantContext.tenantId, identifier);

    if (!conversation) {
      throw new NotFoundException(`Conversation with id/sessionId '${identifier}' not found for tenant`);
    }

    await this.memoryService.handoverConversation(conversation.id);

    const tenant = await this.tenantsService.findOne(tenantContext.tenantId);
    const handoffNotice =
      body.notice ||
      tenant?.settings?.handoffMessage ||
      '⚠️ Conversation handed off to human support via client request.';

    await this.memoryService.addMessage(
      conversation.id,
      'system',
      handoffNotice,
      conversation.channelType || 'api',
      { metadata: { handoffReason: body.reason || 'CLIENT_REQUESTED' } },
    );

    return {
      success: true,
      message: 'Conversation paused and handed off to human support.',
      conversationId: conversation.id,
      sessionId: conversation.channelUserId,
      tenantId: tenantContext.tenantId,
      status: 'handed_off',
      handedOff: true,
      reason: body.reason || 'CLIENT_REQUESTED',
    };
  }
}
