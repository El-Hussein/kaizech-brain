import { Injectable, NotFoundException } from '@nestjs/common';
import { ILLMProvider } from '@kaizech/shared';
import { OpenAIProvider } from './openai.provider';
import { GroqProvider } from './groq.provider';

@Injectable()
export class AIProviderFactory {
  constructor(
    private readonly openaiProvider: OpenAIProvider,
    private readonly groqProvider: GroqProvider,
  ) {}

  getProvider(providerName: string = 'openai'): ILLMProvider {
    switch (providerName.toLowerCase()) {
      case 'openai':
        return this.openaiProvider;
      case 'groq':
        return this.groqProvider;
      default:
        return this.openaiProvider;
    }
  }
}
