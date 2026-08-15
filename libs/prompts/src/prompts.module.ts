import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptTemplateEntity, AgentLearningEntity } from '@kaizech/database';
import { PromptBuilderService } from './prompt-builder.service';

@Module({
  imports: [TypeOrmModule.forFeature([PromptTemplateEntity, AgentLearningEntity])],
  providers: [PromptBuilderService],
  exports: [PromptBuilderService],
})
export class PromptsModule {}
