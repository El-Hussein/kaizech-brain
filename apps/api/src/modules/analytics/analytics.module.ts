import { Module } from '@nestjs/common';
import { AnalyticsModule as AnalyticsLibModule } from '@kaizech/analytics';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [AuthModule, AnalyticsLibModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
