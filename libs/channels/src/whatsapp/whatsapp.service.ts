import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AgentOrchestratorService } from '@kaizech/agent';
import { TenantEntity } from '@kaizech/database';
import { MessageChannel } from '@kaizech/shared';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly agentOrchestrator: AgentOrchestratorService,
  ) {}

  verifyWebhook(mode: string, token: string, challenge: string): string {
    const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN', 'kaizech_verify');
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified successfully');
      return challenge;
    }
    throw new ForbiddenException('Invalid WhatsApp webhook verification token');
  }

  async handleIncomingPayload(payload: any, tenant: TenantEntity): Promise<void> {
    try {
      console.log('📲 Processing WhatsApp Payload for Tenant:', tenant?.name || tenant?.id);
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const statuses = value?.statuses;
      const message = value?.messages?.[0];

      if (statuses) {
        console.log('ℹ️ WhatsApp Status Update (sent/delivered/read):', statuses[0]?.status, 'for recipient:', statuses[0]?.recipient_id);
        return;
      }

      if (!message || message.type !== 'text') {
        console.log('⚠️ Non-text or empty WhatsApp payload received:', JSON.stringify(value));
        return;
      }

      const fromNumber = message.from; // User WhatsApp Phone Number
      const userText = message.text.body;
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
    const token = accessTokenOverride || this.configService.get<string>('WHATSAPP_ACCESS_TOKEN', '');

    const targetPhoneId = phoneNumberId || defaultPhoneNumberId;
    const url = `${baseUrl}/${targetPhoneId}/messages`;

    console.log(`📤 Sending Outbound WhatsApp API Request to ${url}...`);

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
      console.log(`✅ Outbound WhatsApp message sent to ${to}:`, response.data);
    } catch (error: any) {
      const errDetail = error.response ? JSON.stringify(error.response.data) : error.message;
      console.error(`❌ Failed to send WhatsApp message to ${to}: ${errDetail}`);
    }
  }
}
