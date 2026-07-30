import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '@kaizech/database';
import { HealthModule } from './modules/health/health.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ToolsModule } from './modules/tools/tools.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { PlaygroundModule } from './modules/playground/playground.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ChannelsModule } from './modules/channels/channels.module';

import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '../../../.env'),
        '.env.local',
        '.env',
      ],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    DatabaseModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    ConversationsModule,
    KnowledgeModule,
    ToolsModule,
    PromptsModule,
    PlaygroundModule,
    AnalyticsModule,
    ChannelsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
