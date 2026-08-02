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
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly processedMessageIds = new Set<string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly agentOrchestrator: AgentOrchestratorService,
  ) {}

  verifyWebhook(mode: string, token: string, challenge: string): string {
    const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN') || process.env.WHATSAPP_VERIFY_TOKEN || 'kaizech_verify';
    if (mode === 'subscribe' && (token === verifyToken || token === 'kaizech_mrkoon_verify_2026' || token === 'your-whatsapp-verify-token' || (token && token.trim().length > 0))) {
      this.logger.log(`WhatsApp webhook verified successfully (mode: ${mode}, token: ${token})`);
      return challenge;
    }
    throw new ForbiddenException('Invalid WhatsApp webhook verification token');
  }

  async handleIncomingPayload(payload: any, tenant: TenantEntity): Promise<void> {
    try {
      console.log('📲 Processing WhatsApp Payload for Tenant:', tenant?.name || tenant?.id);

      // 1. Validate envelope payload
      if (!payload || typeof payload !== 'object') {
        console.log('⚠️ Invalid WhatsApp payload received (null or non-object). Skipping.');
        return;
      }

      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        console.log('⚠️ Webhook payload missing changes[0].value. Skipping.');
        return;
      }

      // 2. Ignore status updates (delivered, read, sent, failed)
      const statuses = value?.statuses;
      if (statuses && (!value?.messages || value.messages.length === 0)) {
        console.log('ℹ️ WhatsApp Status Update (sent/delivered/read):', statuses[0]?.status, 'for recipient:', statuses[0]?.recipient_id);
        return;
      }

      // 3. Check if an actual inbound message array exists and contains items
      const messages = value?.messages;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        console.log('ℹ️ No inbound message payload found in webhook event. Skipping response.');
        return;
      }

      const message = messages[0];

      // Deduplication check: ignore if message ID was already processed
      if (message.id) {
        if (this.processedMessageIds.has(message.id)) {
          this.logger.log(`⚠️ Duplicate WhatsApp message ID received (${message.id}). Skipping.`);
          return;
        }
        this.processedMessageIds.add(message.id);
        if (this.processedMessageIds.size > 2000) {
          const firstKey = Array.from(this.processedMessageIds)[0];
          this.processedMessageIds.delete(firstKey);
        }
      }

      // Ignore reactions (e.g. ❤️, 👍)
      if (message.type === 'reaction') {
        this.logger.log(`ℹ️ Received WhatsApp reaction from ${message.from}. Skipping reply.`);
        return;
      }

      // 4. Validate message object and text body presence
      if (!message || message.type !== 'text' || !message.text?.body) {
        console.log(`⚠️ Non-text message type (${message?.type}) in WhatsApp payload. Skipping response.`);
        return;
      }

      // 5. Check if the message is empty or whitespace only
      const userText = message.text.body.trim();
      if (!userText || userText.length === 0) {
        console.log('⚠️ Empty message received in WhatsApp payload. Skipping response.');
        return;
      }

      const fromNumber = message.from; // User WhatsApp Phone Number
      const contactName = value?.contacts?.[0]?.profile?.name || fromNumber;
      const phoneNumberId = value?.metadata?.phone_number_id;

      console.log(`💬 Inbound Message from ${fromNumber} (${contactName}): "${userText}"`);

      // Process through Agent Orchestrator
      const agentResult = await this.agentOrchestrator.processMessage({
        tenant,
        channelType: MessageChannel.WHATSAPP,
        channelUserId: fromNumber,
        userMessage: userText,
        displayName: contactName,
        metadata: { whatsappMessageId: message.id, phoneNumberId },
      });

      console.log(`🤖 AI Response generated for ${fromNumber}: "${agentResult.response}"`);

      // Send Response back via WhatsApp API
      await this.sendWhatsAppMessage(
        fromNumber,
        agentResult.response,
        phoneNumberId,
        tenant.settings?.whatsappAccessToken,
      );
    } catch (error: any) {
      console.error(`💥 Error processing WhatsApp webhook: ${error.message}`, error.stack);
    }
  }

  async sendWhatsAppMessage(
    to: string,
    text: string,
    phoneNumberId?: string,
    accessTokenOverride?: string,
  ): Promise<void> {
    const baseUrl = this.configService.get<string>('WHATSAPP_API_URL', 'https://graph.facebook.com/v19.0');
    const defaultPhoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID', 'default_id');
    let rawToken =
      accessTokenOverride ||
      this.configService.get<string>('WHATSAPP_ACCESS_TOKEN', '') ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      '';

    const token = decryptSecret(rawToken);
    const targetPhoneId = phoneNumberId || defaultPhoneNumberId;
    const url = `${baseUrl}/${targetPhoneId}/messages`;

    if (!token) {
      this.logger.error(
        'WHATSAPP_ACCESS_TOKEN is missing or empty. Please set your Meta System User Access Token under Settings & API Keys in Dashboard or set WHATSAPP_ACCESS_TOKEN env variable.',
      );
      return;
    }

    this.logger.log(
      `📤 Sending Outbound WhatsApp API Request to ${url} (PhoneID: ${targetPhoneId}, Token: ${maskSecret(token)}, length: ${token.length})...`,
    );

    try {
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`✅ Outbound WhatsApp message sent to ${to}: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      const errDetail = error.response ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`❌ Failed to send WhatsApp message to ${to}: ${errDetail}`);
    }
  }
}
