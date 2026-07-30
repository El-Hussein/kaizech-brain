import { Module } from '@nestjs/common';
import { AgentModule } from '@kaizech/agent';
import { AuthModule } from '../auth/auth.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PlaygroundController } from './playground.controller';

@Module({
  imports: [AuthModule, TenantsModule, AgentModule],
  controllers: [PlaygroundController],
})
export class PlaygroundModule {}
