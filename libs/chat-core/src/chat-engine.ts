import {
  ChatEngineConfig,
  ChatEngineEvent,
  ChatEngineListener,
  ChatMessage,
  ChatState,
  StorageAdapter,
} from './types';
import { getDefaultStorage } from './storage';
import { KaizechApiClient } from './api-client';

export class KaizechChatEngine {
  private config: ChatEngineConfig;
  private storage: StorageAdapter;
  private apiClient: KaizechApiClient;
  private listeners = new Map<ChatEngineEvent, Set<ChatEngineListener>>();
  
  private state: ChatState = {
    messages: [],
    sessionId: '',
    isOpen: false,
    isTyping: false,
    isStreaming: false,
    error: null,
    limitExceeded: false,
    handedOff: false,
  };

  constructor(config: ChatEngineConfig) {
    this.config = config;
    this.storage = config.storage || getDefaultStorage();
    this.apiClient = new KaizechApiClient();
    this.initSession();
  }

  private async initSession() {
    let sid = this.config.sessionId;
    const storageKey = `kaizech_chat_sid_${this.config.apiKey.substring(0, 10)}`;

    if (!sid) {
      sid = (await this.storage.getItem(storageKey)) || '';
    }

    if (!sid) {
      sid = 'ksid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      await this.storage.setItem(storageKey, sid);
    }

    this.state.sessionId = sid;

    // Load persisted message history if available
    const historyKey = `kaizech_chat_msgs_${sid}`;
    const rawMsgs = await this.storage.getItem(historyKey);
    if (rawMsgs) {
      try {
        const parsed = JSON.parse(rawMsgs);
        if (Array.isArray(parsed)) {
          this.state.messages = parsed;
        }
      } catch (e) {}
    }

    // Add welcome message if history is empty
    if (this.state.messages.length === 0 && this.config.theme?.welcomeMessage) {
      this.state.messages.push({
        id: 'msg_welcome',
        sender: 'assistant',
        content: this.config.theme.welcomeMessage,
        timestamp: Date.now(),
      });
    }

    if (this.config.theme?.autoOpen) {
      this.state.isOpen = true;
    }

    this.emit('state_change', this.getState());
  }

  public getState(): ChatState {
    return { ...this.state, messages: [...this.state.messages] };
  }

  public getConfig(): ChatEngineConfig {
    return { ...this.config };
  }

  public toggleOpen() {
    this.state.isOpen = !this.state.isOpen;
    this.emit('state_change', this.getState());
  }

  public setOpen(isOpen: boolean) {
    this.state.isOpen = isOpen;
    this.emit('state_change', this.getState());
  }

  public async sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || this.state.isStreaming || this.state.isTyping) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      sender: 'user',
      content: trimmed,
      timestamp: Date.now(),
      status: 'sent',
    };

    this.state.messages.push(userMsg);
    this.state.isTyping = true;
    this.state.isStreaming = true;
    this.state.error = null;
    this.emit('state_change', this.getState());
    this.persistHistory();

    const assistantMsgId = 'msg_' + (Date.now() + 1) + '_' + Math.random().toString(36).substring(2, 7);
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    this.state.messages.push(assistantMsg);
    this.emit('state_change', this.getState());

    try {
      const res = await this.apiClient.sendMessageStream({
        apiUrl: this.config.apiUrl,
        apiKey: this.config.apiKey,
        sessionId: this.state.sessionId,
        message: trimmed,
        userMetadata: this.config.userMetadata,
        onChunk: (chunk: string) => {
          const target = this.state.messages.find((m) => m.id === assistantMsgId);
          if (target) {
            target.content += chunk;
            this.emit('stream_chunk', { messageId: assistantMsgId, chunk });
            this.emit('state_change', this.getState());
          }
        },
      });

      const target = this.state.messages.find((m) => m.id === assistantMsgId);
      if (target) {
        target.isStreaming = false;
        if (!target.content && res.reply) {
          target.content = res.reply;
        }
      }

      if (res.meta?.limitExceeded || res.limitExceeded) {
        this.state.limitExceeded = true;
        this.emit('limit_exceeded', true);
      }

      if (res.meta?.handedOff || res.handedOff) {
        this.state.handedOff = true;
      }
    } catch (err: any) {
      console.error('[KaizechChat] [chat-engine] Error in sendMessage:', err);
      const errMsg = err?.message || String(err);
      this.state.error = errMsg;
      const target = this.state.messages.find((m) => m.id === assistantMsgId);
      if (target) {
        target.content = `Sorry, I encountered an issue: ${errMsg}`;
        target.isStreaming = false;
        target.status = 'error';
      }
      this.emit('error', this.state.error);
    } finally {
      this.state.isTyping = false;
      this.state.isStreaming = false;
      this.persistHistory();
      this.emit('state_change', this.getState());
    }
  }

  public async clearHistory() {
    this.state.messages = [];
    if (this.config.theme?.welcomeMessage) {
      this.state.messages.push({
        id: 'msg_welcome',
        sender: 'assistant',
        content: this.config.theme.welcomeMessage,
        timestamp: Date.now(),
      });
    }
    const historyKey = `kaizech_chat_msgs_${this.state.sessionId}`;
    await this.storage.removeItem(historyKey);
    this.emit('state_change', this.getState());
  }

  private async persistHistory() {
    const historyKey = `kaizech_chat_msgs_${this.state.sessionId}`;
    // Store last 50 messages max
    const msgsToStore = this.state.messages.slice(-50).map((m) => ({
      ...m,
      isStreaming: false,
    }));
    await this.storage.setItem(historyKey, JSON.stringify(msgsToStore));
  }

  public on(event: ChatEngineEvent, listener: ChatEngineListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: ChatEngineEvent, listener: ChatEngineListener) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  private emit(event: ChatEngineEvent, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(data);
        } catch (e) {
          console.error(`Error in ChatEngine listener for ${event}:`, e);
        }
      });
    }
  }
}
