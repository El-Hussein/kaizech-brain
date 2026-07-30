import { Injectable, NotFoundException } from '@nestjs/common';
import { ILLMProvider } from '@kaizech/shared';
import { OpenAIProvider } from './openai.provider';

@Injectable()
export class AIProviderFactory {
  constructor(private readonly openaiProvider: OpenAIProvider) {}

  getProvider(providerName: string = 'openai'): ILLMProvider {
    switch (providerName.toLowerCase()) {
      case 'openai':
        return this.openaiProvider;
      default:
        throw new NotFoundException(`AI Provider '${providerName}' is not supported yet.`);
    }
  }
}
