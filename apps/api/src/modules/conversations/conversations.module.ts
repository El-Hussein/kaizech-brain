import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity, MessageEntity, TenantEntity } from '@kaizech/database';
import { MemoryModule } from '@kaizech/memory';
import { ChannelsModule as ChannelsLibModule } from '@kaizech/channels';
import { AuthModule } from '../auth/auth.module';
import { ConversationsController } from './conversations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationEntity, MessageEntity, TenantEntity]),
    AuthModule,
    MemoryModule,
    ChannelsLibModule,
  ],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
