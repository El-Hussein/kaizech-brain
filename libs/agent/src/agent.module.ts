import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PromptsModule } from '@kaizech/prompts';
import { MemoryModule } from '@kaizech/memory';
import { ToolsModule } from '@kaizech/tools';
import { RAGModule } from '@kaizech/rag';
import { OpenAIProvider } from './providers/openai.provider';
import { GroqProvider } from './providers/groq.provider';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { RagAgentDagService } from './rag-agent-dag.service';

import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { DecisionTreeService } from './decision-tree.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowEntity } from '@kaizech/database/entities/workflow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowEntity]),
    ConfigModule,
    HttpModule,
    CacheModule.register(),
    PromptsModule,
    MemoryModule,
    ToolsModule,
    RAGModule,
  ],
  providers: [OpenAIProvider, GroqProvider, AIProviderFactory, AgentOrchestratorService, RagAgentDagService, DecisionTreeService],
  exports: [AgentOrchestratorService, AIProviderFactory, OpenAIProvider, GroqProvider, MemoryModule, RagAgentDagService, DecisionTreeService],
})
export class AgentModule {}
