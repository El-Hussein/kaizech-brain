import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewQuestionEntity, BusinessInterviewEntity, InterviewResponseEntity, TenantEntity } from '@kaizech/database';
import { AgentModule } from '@kaizech/agent';
import { KnowledgeModule } from '@kaizech/knowledge';
import { QuestionEngineService } from './services/question-engine.service';
import { ResponseEvaluatorService } from './services/response-evaluator.service';
import { InterviewToKnowledgeService } from './services/interview-to-knowledge.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([InterviewQuestionEntity, BusinessInterviewEntity, InterviewResponseEntity, TenantEntity]),
    AgentModule,
    KnowledgeModule,
  ],
  providers: [QuestionEngineService, ResponseEvaluatorService, InterviewToKnowledgeService],
  exports: [QuestionEngineService, ResponseEvaluatorService, InterviewToKnowledgeService],
})
export class VoiceOnboardingModule {}
