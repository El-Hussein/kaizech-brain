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
  private formatApiUrl(apiUrl: string): string {
    let cleanUrl = apiUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/api/v1')) {
      if (cleanUrl.endsWith('/api')) {
        cleanUrl += '/v1';
      } else {
        cleanUrl += '/api/v1';
      }
    }
    console.log('[KaizechChat] Formatted API URL:', cleanUrl);
    return cleanUrl;
  }

  async sendMessageSync(options: SendMessageOptions) {
    const { apiUrl, apiKey, sessionId, message, userMetadata, channel = 'api' } = options;
    const cleanUrl = this.formatApiUrl(apiUrl);
    const targetUrl = `${cleanUrl}/channels/chat`;

    console.log(`[KaizechChat] [sendMessageSync] Sending POST to: ${targetUrl}`);
    console.log(`[KaizechChat] [sendMessageSync] Key (prefix): ${apiKey ? apiKey.substring(0, 15) + '...' : 'EMPTY'}`);
    console.log(`[KaizechChat] [sendMessageSync] SessionId: ${sessionId}`);

    try {
      const response = await fetch(targetUrl, {
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

      console.log(`[KaizechChat] [sendMessageSync] HTTP Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[KaizechChat] [sendMessageSync] HTTP Error (${response.status}):`, errText);
        throw new Error(`API Request failed (${response.status}): ${errText}`);
      }

      const data = await response.json();
      console.log(`[KaizechChat] [sendMessageSync] Response JSON received successfully:`, data);
      return data;
    } catch (err: any) {
      console.error(`[KaizechChat] [sendMessageSync] Exception caught:`, err?.message || err);
      throw err;
    }
  }

  async sendMessageStream(options: SendMessageOptions) {
    const isReactNative =
      typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

    console.log(`[KaizechChat] [sendMessageStream] isReactNative: ${isReactNative}`);

    if (isReactNative) {
      console.log(`[KaizechChat] [sendMessageStream] React Native environment detected. Routing directly to sendMessageSync.`);
      const syncRes = await this.sendMessageSync(options);
      if (options.onChunk && syncRes.reply) {
        options.onChunk(syncRes.reply);
      }
      return syncRes;
    }

    const { apiUrl, apiKey, sessionId, message, userMetadata, channel = 'api', onChunk } = options;
    const cleanUrl = this.formatApiUrl(apiUrl);
    const targetUrl = `${cleanUrl}/channels/chat-stream`;

    console.log(`[KaizechChat] [sendMessageStream] Sending stream POST to: ${targetUrl}`);

    try {
      const response = await fetch(targetUrl, {
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

      console.log(`[KaizechChat] [sendMessageStream] HTTP Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[KaizechChat] [sendMessageStream] Stream HTTP Error (${response.status}):`, errText);
        throw new Error(`Stream Request failed (${response.status}): ${errText}`);
      }

      if (!response.body || typeof (response.body as any).getReader !== 'function') {
        console.log(`[KaizechChat] [sendMessageStream] No body.getReader found. Falling back to sendMessageSync.`);
        const syncRes = await this.sendMessageSync(options);
        if (onChunk && syncRes.reply) {
          onChunk(syncRes.reply);
        }
        return syncRes;
      }

      const reader = (response.body as any).getReader();
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
            } catch (e) {}
          }
        }
      }

      return {
        reply: fullContent,
        meta,
      };
    } catch (streamErr: any) {
      console.warn(`[KaizechChat] [sendMessageStream] Stream failed (${streamErr?.message}). Attempting fallback to sendMessageSync...`);
      try {
        const syncRes = await this.sendMessageSync(options);
        if (onChunk && syncRes.reply) {
          onChunk(syncRes.reply);
        }
        return syncRes;
      } catch (syncErr: any) {
        console.error(`[KaizechChat] [sendMessageStream] Fallback sendMessageSync also failed:`, syncErr?.message || syncErr);
        throw streamErr;
      }
    }
  }
}
