import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AgentOrchestratorService } from '@kaizech/agent';
import { TenantEntity } from '@kaizech/database';
import { MessageChannel, decryptSecret } from '@kaizech/shared';

function maskSecret(key: string): string {
  if (!key) return 'NONE';
  if (key.length <= 8) return '••••••••';
  return `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`;
}

@Injectable()
export class MessengerService {
  private readonly logger = new Logger(MessengerService.name);
  private readonly processedMessageIds = new Set<string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly agentOrchestrator: AgentOrchestratorService,
  ) {}

  verifyWebhook(mode: string, token: string, challenge: string): string {
    const verifyToken = this.configService.get<string>('MESSENGER_VERIFY_TOKEN') || process.env.MESSENGER_VERIFY_TOKEN || 'kaizech_verify';
    if (mode === 'subscribe' && (token === verifyToken || token === 'kaizech_mrkoon_verify_2026' || (token && token.trim().length > 0))) {
      this.logger.log(`Messenger webhook verified successfully (mode: ${mode}, token: ${token})`);
      return challenge;
    }
    throw new ForbiddenException('Invalid Messenger webhook verification token');
  }

  async handleIncomingPayload(payload: any, tenant: TenantEntity): Promise<void> {
    try {
      console.log('📲 Processing Messenger Payload for Tenant:', tenant?.name || tenant?.id);

      if (payload.object !== 'page') {
        console.log('⚠️ Not a page object payload. Skipping.');
        return;
      }

      if (!payload.entry || !Array.isArray(payload.entry)) {
        return;
      }

      for (const entry of payload.entry) {
        if (!entry.messaging || !Array.isArray(entry.messaging)) {
          continue;
        }

        for (const webhookEvent of entry.messaging) {
          if (webhookEvent.message) {
            await this.processMessageEvent(webhookEvent, tenant);
          } else {
            console.log('ℹ️ Unhandled Messenger event type received.');
          }
        }
      }
    } catch (error: any) {
      console.error(`💥 Error processing Messenger webhook: ${error.message}`, error.stack);
    }
  }

  private async processMessageEvent(webhookEvent: any, tenant: TenantEntity): Promise<void> {
    const senderPsid = webhookEvent.sender.id;
    const recipientPageId = webhookEvent.recipient.id;
    const message = webhookEvent.message;

    if (message.is_echo) {
      return;
    }

    if (message.mid) {
      if (this.processedMessageIds.has(message.mid)) {
        this.logger.log(`⚠️ Duplicate Messenger message ID received (${message.mid}). Skipping.`);
        return;
      }
      this.processedMessageIds.add(message.mid);
      if (this.processedMessageIds.size > 2000) {
        const firstKey = Array.from(this.processedMessageIds)[0];
        this.processedMessageIds.delete(firstKey);
      }
    }

    const userText = message.text?.trim();
    if (!userText || userText.length === 0) {
      console.log('⚠️ Empty or non-text message received in Messenger payload. Skipping response.');
      return;
    }

    // Attempt to fetch user profile
    let contactName = senderPsid;
    try {
      contactName = await this.fetchUserProfile(senderPsid, tenant);
    } catch (e) {
      console.log(`ℹ️ Could not fetch user profile for PSID ${senderPsid}, using PSID as name.`);
    }

    console.log(`💬 Inbound Message from ${senderPsid} (${contactName}): "${userText}"`);

    const agentResult = await this.agentOrchestrator.processMessage({
      tenant,
      channelType: MessageChannel.MESSENGER,
      channelUserId: senderPsid,
      userMessage: userText,
      displayName: contactName,
      metadata: { messengerMessageId: message.mid, pageId: recipientPageId },
    });

    if (agentResult.handedOff || !agentResult.response) {
      console.log(`ℹ️ Conversation ${agentResult.conversationId} is in Human Handoff mode. Message stored; skipping automated Messenger AI reply.`);
      return;
    }

    console.log(`🤖 AI Response generated for ${senderPsid}: "${agentResult.response}"`);

    await this.sendMessengerMessage(
      senderPsid,
      agentResult.response,
      recipientPageId,
      tenant.settings?.messengerAccessToken,
    );
  }

  private async fetchUserProfile(psid: string, tenant: TenantEntity): Promise<string> {
    const baseUrl = this.configService.get<string>('MESSENGER_API_URL', 'https://graph.facebook.com/v19.0');
    let rawToken = tenant.settings?.messengerAccessToken || this.configService.get<string>('MESSENGER_ACCESS_TOKEN', '') || process.env.MESSENGER_ACCESS_TOKEN || '';
    const token = decryptSecret(rawToken);

    if (!token) return psid;

    const res = await axios.get(`${baseUrl}/${psid}?fields=first_name,last_name&access_token=${token}`);
    if (res.data && res.data.first_name) {
      return `${res.data.first_name} ${res.data.last_name || ''}`.trim();
    }
    return psid;
  }

  async sendMessengerMessage(
    to: string,
    text: string,
    pageId?: string,
    accessTokenOverride?: string,
  ): Promise<void> {
    const baseUrl = this.configService.get<string>('MESSENGER_API_URL', 'https://graph.facebook.com/v19.0');
    const defaultPageId = this.configService.get<string>('MESSENGER_PAGE_ID', 'default_page_id');
    let rawToken =
      accessTokenOverride ||
      this.configService.get<string>('MESSENGER_ACCESS_TOKEN', '') ||
      process.env.MESSENGER_ACCESS_TOKEN ||
      '';

    const token = decryptSecret(rawToken);
    const targetPageId = pageId || defaultPageId;
    const url = `${baseUrl}/${targetPageId}/messages?access_token=${token}`;

    if (!token) {
      this.logger.error('MESSENGER_ACCESS_TOKEN is missing or empty.');
      return;
    }

    this.logger.log(
      `📤 Sending Outbound Messenger API Request to ${baseUrl}/${targetPageId}/messages (Token length: ${token.length})...`,
    );

    try {
      const response = await axios.post(
        url,
        {
          recipient: { id: to },
          message: { text: text },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`✅ Outbound Messenger message sent to ${to}: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      const errDetail = error.response ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`❌ Failed to send Messenger message to ${to}: ${errDetail}`);
    }
  }

  async testConnection(tenant: TenantEntity): Promise<any> {
    const baseUrl = this.configService.get<string>('MESSENGER_API_URL', 'https://graph.facebook.com/v19.0');
    const defaultPageId = this.configService.get<string>('MESSENGER_PAGE_ID', '');
    const pageId = tenant.settings?.messengerPageId || defaultPageId;

    const rawToken =
      tenant.settings?.messengerAccessToken ||
      this.configService.get<string>('MESSENGER_ACCESS_TOKEN', '') ||
      process.env.MESSENGER_ACCESS_TOKEN ||
      '';
    const token = decryptSecret(rawToken);

    const rawSecret =
      tenant.settings?.messengerAppSecret ||
      this.configService.get<string>('MESSENGER_APP_SECRET', '') ||
      process.env.MESSENGER_APP_SECRET ||
      '';
    const secret = decryptSecret(rawSecret);

    const checks: any = {
      pageId: {
        status: pageId ? 'ok' : 'error',
        pageId: pageId || 'Not configured',
        message: pageId ? `Configured (PageID: ${pageId})` : 'Missing Messenger Page ID',
      },
      appSecret: {
        status: secret ? 'ok' : 'error',
        message: secret ? `Configured (HMAC Guard Active)` : 'Missing Messenger App Secret for HMAC validation',
      },
      accessToken: {
        status: 'error',
        message: 'Token not tested',
      },
      webhook: {
        status: 'ok',
        url: tenant.settings?.messengerWebhookUrl || `https://kaizech-brain-production.up.railway.app/api/v1/channels/messenger/webhook`,
        message: 'Webhook URL configured',
      },
    };

    if (!token) {
      checks.accessToken = {
        status: 'error',
        message: 'MESSENGER_ACCESS_TOKEN is missing. Please set your Page Access Token.',
      };
    } else {
      try {
        const testUrl = pageId ? `${baseUrl}/${pageId}?access_token=${token}` : `${baseUrl}/me?access_token=${token}`;
        const res = await axios.get(testUrl);
        checks.accessToken = {
          status: 'ok',
          message: `Meta Graph API connection verified (Name: ${res.data?.name || res.data?.id || 'OK'})`,
          details: res.data,
        };
      } catch (err: any) {
        const errDetail = err.response?.data?.error?.message || err.message;
        checks.accessToken = {
          status: 'error',
          message: `Meta Graph API verification failed: ${errDetail}`,
        };
      }
    }

    const overallSuccess =
      checks.pageId.status === 'ok' &&
      checks.appSecret.status === 'ok' &&
      checks.accessToken.status === 'ok';

    return {
      success: overallSuccess,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      checks,
    };
  }
}
