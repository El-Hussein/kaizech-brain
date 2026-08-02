import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsModule as ChannelsLibModule, MetaSignatureGuard } from '@kaizech/channels';
import { AgentModule } from '@kaizech/agent';
import { TenantEntity } from '@kaizech/database';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';
import { ChannelsController } from './channels.controller';

@Module({
  imports: [
    TenantsModule,
    AuthModule,
    AgentModule,
    ChannelsLibModule,
    TypeOrmModule.forFeature([TenantEntity]),
  ],
  controllers: [ChannelsController],
  providers: [MetaSignatureGuard],
})
export class ChannelsModule {}

