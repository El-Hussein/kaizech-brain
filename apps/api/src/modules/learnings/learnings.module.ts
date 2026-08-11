import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentLearningEntity, ConversationEntity, MessageEntity } from '@kaizech/database';
import { RAGModule } from '@kaizech/rag';
import { LearningsController } from './learnings.controller';
import { LearningsService } from './learnings.service';
import { LearningsCronService } from './learnings.cron.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentLearningEntity, ConversationEntity, MessageEntity]),
    RAGModule,
  ],
  controllers: [LearningsController],
  providers: [LearningsService, LearningsCronService],
})
export class LearningsModule {}
