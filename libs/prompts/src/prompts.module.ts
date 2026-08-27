import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptTemplateEntity } from '@kaizech/database';
import { PromptBuilderService } from './prompt-builder.service';

@Module({
  imports: [TypeOrmModule.forFeature([PromptTemplateEntity])],
  providers: [PromptBuilderService],
  exports: [PromptBuilderService],
})
export class PromptsModule {}
