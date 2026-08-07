export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  status?: 'sending' | 'sent' | 'error';
}

export interface ChatThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  userBubbleBg?: string;
  userBubbleText?: string;
  assistantBubbleBg?: string;
  assistantBubbleText?: string;
  inputBg?: string;
  inputText?: string;
  botTitle?: string;
  botAvatarUrl?: string;
  welcomeMessage?: string;
  position?: 'bottom-right' | 'bottom-left';
  suggestedQuestions?: string[];
  placeholderText?: string;
  autoOpen?: boolean;
  mode?: 'dark' | 'light';
}

export interface UserMetadata {
  userId?: string;
  displayName?: string;
  email?: string;
  customData?: Record<string, any>;
}

export interface ChatEngineConfig {
  apiUrl: string;
  apiKey: string;
  sessionId?: string;
  theme?: ChatThemeConfig;
  userMetadata?: UserMetadata;
  storage?: StorageAdapter;
}

export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export interface ChatState {
  messages: ChatMessage[];
  sessionId: string;
  isOpen: boolean;
  isTyping: boolean;
  isStreaming: boolean;
  error: string | null;
  limitExceeded: boolean;
  handedOff: boolean;
}

export type ChatEngineEvent = 
  | 'state_change'
  | 'message_received'
  | 'stream_chunk'
  | 'error'
  | 'limit_exceeded';

export type ChatEngineListener<T = any> = (data: T) => void;
