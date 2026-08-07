import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  ILLMProvider,
  ChatCompletionOptions,
  ChatCompletionResult,
  ToolCall,
  AIProviderException,
  decryptSecret,
} from '@kaizech/shared';

function generateFallbackEmbedding(text: string, dimensions: number = 1536): number[] {
  const vector = new Array(dimensions).fill(0);
  const cleanText = (text || '').toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, '');
  const words = cleanText.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    vector[0] = 1.0;
    return vector;
  }

  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = vector[i] / magnitude;
    }
  } else {
    vector[0] = 1.0;
  }

  return vector;
}

@Injectable()
export class GroqProvider implements ILLMProvider {
  readonly providerName = 'groq';
  private readonly logger = new Logger(GroqProvider.name);
  private defaultModel: string;

  constructor(private readonly configService: ConfigService) {
    this.defaultModel = this.configService.get<string>('GROQ_MODEL', 'llama-3.3-70b-versatile');
  }

  private getClient(customApiKey?: string): OpenAI | null {
    const rawKey =
      customApiKey ||
      this.configService.get<string>('GROQ_API_KEY') ||
      process.env.GROQ_API_KEY ||
      '';
    const apiKey = decryptSecret(rawKey);
    if (!apiKey || apiKey.trim() === '' || apiKey === 'undefined') {
      return null;
    }
    return new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    try {
      const client = this.getClient(options.apiKey);
      if (!client) {
        throw new AIProviderException(
          'groq',
          'Groq API key is missing. Please configure GROQ_API_KEY in environment variables or tenant settings.',
        );
      }

      const model = options.model || this.defaultModel;
      const formattedMessages: any[] = options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content || '',
        ...(msg.name ? { name: msg.name } : {}),
        ...(msg.toolCallId ? { tool_call_id: msg.toolCallId } : {}),
      }));

      const requestBody: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model,
        messages: formattedMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
      };

      if (options.tools && options.tools.length > 0) {
        requestBody.tools = options.tools as any;
      }

      const completion = await client.chat.completions.create(requestBody);
      const choice = completion.choices[0];
      const message = choice.message;

      const toolCalls: ToolCall[] = (message.tool_calls || []).map((tc) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      }));

      return {
        content: message.content || null,
        toolCalls,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        finishReason: choice.finish_reason || 'stop',
        model: completion.model,
      };
    } catch (error: any) {
      this.logger.error(`Groq API error: ${error.message}`, error.stack);
      throw new AIProviderException('groq', error.message);
    }
  }

  async chatCompletionStream(
    options: ChatCompletionOptions,
    onChunk: (chunk: string) => void,
  ): Promise<ChatCompletionResult> {
    try {
      const client = this.getClient(options.apiKey);
      if (!client) {
        throw new AIProviderException(
          'groq',
          'Groq API key is missing. Please configure GROQ_API_KEY in environment variables or tenant settings.',
        );
      }

      const model = options.model || this.defaultModel;
      const formattedMessages: any[] = options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content || '',
        ...(msg.name ? { name: msg.name } : {}),
        ...(msg.toolCallId ? { tool_call_id: msg.toolCallId } : {}),
      }));

      const requestBody: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
        model,
        messages: formattedMessages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        stream: true,
        stream_options: { include_usage: true },
      };

      if (options.tools && options.tools.length > 0) {
        requestBody.tools = options.tools as any;
      }

      const stream = await client.chat.completions.create(requestBody);
      let fullContent = '';
      let finishReason = 'stop';
      const accumulatedToolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();
      let promptTokens = 0;
      let completionTokens = 0;
      let totalTokens = 0;

      for await (const chunk of stream as any) {
        const usage = chunk.usage || chunk.x_groq?.usage;
        if (usage) {
          promptTokens = usage.prompt_tokens || 0;
          completionTokens = usage.completion_tokens || 0;
          totalTokens = usage.total_tokens || 0;
        }

        const choice = chunk.choices?.[0];
        if (!choice) continue;

        if (choice.finish_reason) {
          finishReason = choice.finish_reason;
        }

        const delta = choice.delta;
        if (delta?.content) {
          fullContent += delta.content;
          onChunk(delta.content);
        }

        if (delta?.tool_calls) {
          for (const tcDelta of delta.tool_calls) {
            const index = tcDelta.index;
            if (!accumulatedToolCalls.has(index)) {
              accumulatedToolCalls.set(index, {
                id: tcDelta.id || '',
                name: tcDelta.function?.name || '',
                arguments: tcDelta.function?.arguments || '',
              });
            } else {
              const current = accumulatedToolCalls.get(index)!;
              if (tcDelta.id) current.id = tcDelta.id;
              if (tcDelta.function?.name) current.name += tcDelta.function.name;
              if (tcDelta.function?.arguments) current.arguments += tcDelta.function.arguments;
            }
          }
        }
      }

      const toolCalls: ToolCall[] = Array.from(accumulatedToolCalls.values()).map((tc) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.name,
          arguments: tc.arguments,
        },
      }));

      return {
        content: fullContent || null,
        toolCalls,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
        finishReason,
        model,
      };
    } catch (error: any) {
      this.logger.error(`Groq Stream API error: ${error.message}`, error.stack);
      throw new AIProviderException('groq', error.message);
    }
  }

  async generateEmbedding(text: string, model?: string, customApiKey?: string): Promise<number[]> {
    return generateFallbackEmbedding(text, 1536);
  }

  async generateEmbeddings(texts: string[], model?: string, customApiKey?: string): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];
    return texts.map((t) => generateFallbackEmbedding(t, 1536));
  }
}
