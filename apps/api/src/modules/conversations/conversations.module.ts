import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity, MessageEntity } from '@kaizech/database';
import { MemoryModule } from '@kaizech/memory';
import { AuthModule } from '../auth/auth.module';
import { ConversationsController } from './conversations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationEntity, MessageEntity]),
    AuthModule,
    MemoryModule,
  ],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
