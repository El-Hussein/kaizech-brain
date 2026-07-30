import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from '@kaizech/agent';
import { WhatsAppService } from './whatsapp/whatsapp.service';

@Module({
  imports: [ConfigModule, AgentModule],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class ChannelsModule {}
