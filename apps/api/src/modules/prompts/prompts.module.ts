import { Module } from '@nestjs/common';
import { PromptsModule as PromptsLibModule } from '@kaizech/prompts';
import { AuthModule } from '../auth/auth.module';
import { PromptsController } from './prompts.controller';

@Module({
  imports: [AuthModule, PromptsLibModule],
  controllers: [PromptsController],
})
export class PromptsModule {}
