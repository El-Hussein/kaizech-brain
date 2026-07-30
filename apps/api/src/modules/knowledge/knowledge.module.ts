import { Module } from '@nestjs/common';
import { KnowledgeModule as KnowledgeLibModule } from '@kaizech/knowledge';
import { AuthModule } from '../auth/auth.module';
import { KnowledgeController } from './knowledge.controller';

@Module({
  imports: [AuthModule, KnowledgeLibModule],
  controllers: [KnowledgeController],
})
export class KnowledgeModule {}
