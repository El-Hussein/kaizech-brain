import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PromptsModule } from '@kaizech/prompts';
import { MemoryModule } from '@kaizech/memory';
import { ToolsModule } from '@kaizech/tools';
import { RAGModule } from '@kaizech/rag';
import { OpenAIProvider } from './providers/openai.provider';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { AgentOrchestratorService } from './agent-orchestrator.service';

@Module({
  imports: [
    ConfigModule,
    PromptsModule,
    MemoryModule,
    ToolsModule,
    RAGModule,
  ],
  providers: [OpenAIProvider, AIProviderFactory, AgentOrchestratorService],
  exports: [AgentOrchestratorService, AIProviderFactory, OpenAIProvider],
})
export class AgentModule {}
