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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { WhatsAppService } from '@kaizech/channels';
import { MetaSignatureGuard } from './meta-signature.guard';
import { AgentOrchestratorService } from '@kaizech/agent';
import { TenantsService } from '../tenants/tenants.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { MessageChannel } from '@kaizech/shared';

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
  async handleWhatsAppIncomingRoot(@Body() payload: any) {
    console.log('📥 [WhatsApp Webhook POST Received]:', JSON.stringify(payload, null, 2));

    const tenants = await this.tenantsService.findAll();
    const tenant = tenants.find((t) => t.slug === 'mrkoon-auctions') || tenants[0];

    if (tenant) {
      await this.whatsappService.handleIncomingPayload(payload, tenant);
    } else {
      console.warn('⚠️ No active tenant found to process WhatsApp message.');
    }
    return { status: 'EVENT_RECEIVED' };
  }

  @Post('whatsapp/webhook/:tenantId')
  @UseGuards(MetaSignatureGuard)
  @ApiOperation({ summary: 'WhatsApp Incoming Message with Tenant ID' })
  async handleWhatsAppIncomingTenant(
    @Param('tenantId') tenantId: string,
    @Body() payload: any,
  ) {
    console.log('📥 [WhatsApp Webhook POST Received for Tenant]:', tenantId, JSON.stringify(payload, null, 2));

    const tenant = await this.tenantsService.findOne(tenantId);
    if (tenant) {
      await this.whatsappService.handleIncomingPayload(payload, tenant);
    }
    return { status: 'EVENT_RECEIVED' };
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

    const tenant = await this.tenantsService.findOne(tenantContext.tenantId);

    const channelType =
      body.channel === 'whatsapp'
        ? MessageChannel.WHATSAPP
        : MessageChannel.API;

    const result = await this.agentOrchestrator.processMessage({
      tenant,
      channelType,
      channelUserId: body.sessionId,
      userMessage: body.message,
      displayName: body.displayName ?? body.sessionId,
      metadata: { apiKeyId: tenantContext.apiKeyId },
    });

    return {
      reply: result.response,
      sessionId: body.sessionId,
      tenantId: tenantContext.tenantId,
      tokens: result.tokenUsage?.totalTokens ?? null,
    };
  }
}
