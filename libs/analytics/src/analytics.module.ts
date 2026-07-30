import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEventEntity, MessageEntity, ConversationEntity, TenantEntity } from '@kaizech/database';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalyticsEventEntity,
      MessageEntity,
      ConversationEntity,
      TenantEntity,
    ]),
  ],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
