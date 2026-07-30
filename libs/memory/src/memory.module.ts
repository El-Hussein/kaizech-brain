import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity, MessageEntity, UserProfileEntity } from '@kaizech/database';
import { MemoryService } from './memory.service';
import { UserProfileService } from './user-profile.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      MessageEntity,
      UserProfileEntity,
    ]),
  ],
  providers: [MemoryService, UserProfileService],
  exports: [MemoryService, UserProfileService],
})
export class MemoryModule {}
