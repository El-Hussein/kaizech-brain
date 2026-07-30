import { Module } from '@nestjs/common';
import { ToolsModule as ToolsLibModule } from '@kaizech/tools';
import { AuthModule } from '../auth/auth.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ToolsController } from './tools.controller';

@Module({
  imports: [AuthModule, TenantsModule, ToolsLibModule],
  controllers: [ToolsController],
})
export class ToolsModule {}
