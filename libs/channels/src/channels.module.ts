import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from '@kaizech/agent';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { MessengerService } from './messenger/messenger.service';

@Module({
  imports: [ConfigModule, AgentModule],
  providers: [WhatsAppService, MessengerService],
  exports: [WhatsAppService, MessengerService],
})
export class ChannelsModule {}
