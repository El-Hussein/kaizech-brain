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
export class OpenAIProvider implements ILLMProvider {
  readonly providerName = 'openai';
  private readonly logger = new Logger(OpenAIProvider.name);
  private openai: OpenAI;
  private defaultModel: string;
  private defaultEmbeddingModel: string;
  private embeddingCache: Map<string, number[]> = new Map();
  private readonly MAX_CACHE_SIZE = 500;

  constructor(private readonly configService: ConfigService) {
    this.defaultModel = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    this.defaultEmbeddingModel = this.configService.get<string>(
      'OPENAI_EMBEDDING_MODEL',
      'text-embedding-3-small',
    );
  }

  private getClient(customApiKey?: string): OpenAI | null {
    const rawKey =
      customApiKey ||
      this.configService.get<string>('OPENAI_API_KEY') ||
      process.env.OPENAI_API_KEY ||
      '';
    const apiKey = decryptSecret(rawKey);
    if (!apiKey || apiKey.trim() === '' || apiKey === 'undefined') {
      return null;
    }
    return new OpenAI({
      apiKey,
    });
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    try {
      const client = this.getClient(options.apiKey);
      if (!client) {
        throw new AIProviderException(
          'openai',
          'OpenAI API key is missing. Please configure OPENAI_API_KEY in environment variables or tenant settings.',
        );
      }

      const model = options.model || this.defaultModel;

      const formattedMessages: any[] = [];

      for (let i = 0; i < options.messages.length; i++) {
        const msg = options.messages[i];
        const messageObj: any = {
          role: msg.role,
          content: msg.content || '',
        };

        if (msg.name) {
          messageObj.name = msg.name;
        }

        if (msg.toolCallId) {
          messageObj.tool_call_id = msg.toolCallId;
        }

        if (msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) {
          const validToolCalls: any[] = [];

          for (const tc of msg.toolCalls as any[]) {
            const tcId = tc.id || `call_${Math.random().toString(36).substring(2, 9)}`;
            const hasNextToolResponse = options.messages
              .slice(i + 1)
              .some((nextMsg) => nextMsg.role === 'tool' && nextMsg.toolCallId === tcId);

            if (hasNextToolResponse) {
              validToolCalls.push({
                id: tcId,
                type: tc.type || 'function',
                function: {
                  name: tc.function?.name || tc.name || 'unknown_tool',
                  arguments:
                    typeof tc.function?.arguments === 'string'
                      ? tc.function.arguments
                      : JSON.stringify(tc.function?.arguments || tc.args || {}),
                },
              });
            }
          }

          if (validToolCalls.length > 0) {
            messageObj.tool_calls = validToolCalls;
          }
        }

        formattedMessages.push(messageObj);
      }

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
      this.logger.error(`OpenAI API error: ${error.message}`, error.stack);
      throw new AIProviderException('openai', error.message);
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
          'openai',
          'OpenAI API key is missing. Please configure OPENAI_API_KEY in environment variables or tenant settings.',
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
      };

      if (options.tools && options.tools.length > 0) {
        requestBody.tools = options.tools as any;
      }

      const stream = await client.chat.completions.create(requestBody);
      let fullContent = '';
      let finishReason = 'stop';
      const accumulatedToolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();

      for await (const chunk of stream as any) {
        const choice = chunk.choices[0];
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
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason,
        model,
      };
    } catch (error: any) {
      this.logger.error(`OpenAI Stream API error: ${error.message}`, error.stack);
      throw new AIProviderException('openai', error.message);
    }
  }

  async generateEmbedding(text: string, model?: string, customApiKey?: string): Promise<number[]> {
    const cacheKey = `${model || this.defaultEmbeddingModel}:${text}`;
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    const client = this.getClient(customApiKey);
    if (!client) {
      this.logger.warn('No OpenAI API key found. Using fallback vector embedding.');
      return generateFallbackEmbedding(text, 1536);
    }

    try {
      const response = await client.embeddings.create({
        model: model || this.defaultEmbeddingModel,
        input: text,
      });
      const embedding = response.data[0].embedding;

      if (this.embeddingCache.size >= this.MAX_CACHE_SIZE) {
        const firstKey = this.embeddingCache.keys().next().value;
        if (firstKey) this.embeddingCache.delete(firstKey);
      }
      this.embeddingCache.set(cacheKey, embedding);

      return embedding;
    } catch (error: any) {
      this.logger.warn(`OpenAI Embedding error (${error.message}). Using fallback vector embedding.`);
      return generateFallbackEmbedding(text, 1536);
    }
  }

  async generateEmbeddings(texts: string[], model?: string, customApiKey?: string): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];
    const client = this.getClient(customApiKey);
    if (!client) {
      this.logger.warn('No OpenAI API key found. Using fallback vector embeddings for batch.');
      return texts.map((t) => generateFallbackEmbedding(t, 1536));
    }

    try {
      const response = await client.embeddings.create({
        model: model || this.defaultEmbeddingModel,
        input: texts,
      });
      const embeddings = response.data.map((item) => item.embedding);

      texts.forEach((text, i) => {
        const cacheKey = `${model || this.defaultEmbeddingModel}:${text}`;
        if (this.embeddingCache.size < this.MAX_CACHE_SIZE) {
          this.embeddingCache.set(cacheKey, embeddings[i]);
        }
      });

      return embeddings;
    } catch (error: any) {
      this.logger.warn(`OpenAI Embeddings error (${error.message}). Using fallback vector embeddings for batch.`);
      return texts.map((t) => generateFallbackEmbedding(t, 1536));
    }
  }
}
