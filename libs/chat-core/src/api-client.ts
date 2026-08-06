import { UserMetadata } from './types';

export interface SendMessageOptions {
  apiUrl: string;
  apiKey: string;
  sessionId: string;
  message: string;
  userMetadata?: UserMetadata;
  channel?: string;
  onChunk?: (chunk: string) => void;
}

export class KaizechApiClient {
  async sendMessageSync(options: SendMessageOptions) {
    const { apiUrl, apiKey, sessionId, message, userMetadata, channel = 'api' } = options;
    const cleanUrl = apiUrl.replace(/\/+$/, '');

    const response = await fetch(`${cleanUrl}/channels/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        message,
        sessionId,
        channel,
        displayName: userMetadata?.displayName || userMetadata?.email || sessionId,
        metadata: userMetadata?.customData,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Request failed (${response.status}): ${errText}`);
    }

    return await response.json();
  }

  async sendMessageStream(options: SendMessageOptions) {
    const { apiUrl, apiKey, sessionId, message, userMetadata, channel = 'api', onChunk } = options;
    const cleanUrl = apiUrl.replace(/\/+$/, '');

    const response = await fetch(`${cleanUrl}/channels/chat-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        message,
        sessionId,
        channel,
        displayName: userMetadata?.displayName || userMetadata?.email || sessionId,
        metadata: userMetadata?.customData,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Stream Request failed (${response.status}): ${errText}`);
    }

    if (!response.body || typeof response.body.getReader !== 'function') {
      // Fallback for environments where body.getReader() is not available
      const json = await response.json();
      if (onChunk && json.reply) {
        onChunk(json.reply);
      }
      return json;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullContent = '';
    let meta: any = null;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const rawData = trimmed.replace(/^data:\s*/, '');
          try {
            const parsed = JSON.parse(rawData);
            if (parsed.chunk) {
              fullContent += parsed.chunk;
              if (onChunk) onChunk(parsed.chunk);
            } else if (parsed.event === 'DONE') {
              meta = parsed.meta;
            }
          } catch (e) {
            // Ignore parse errors on partial streams
          }
        }
      }
    }

    return {
      reply: fullContent,
      meta,
    };
  }
}
