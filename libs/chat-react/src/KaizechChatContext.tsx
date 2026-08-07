import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  KaizechChatEngine,
  ChatEngineConfig,
  ChatState,
  ChatMessage,
} from './core';

interface KaizechChatContextValue {
  engine: KaizechChatEngine | null;
  state: ChatState;
  sendMessage: (message: string) => Promise<void>;
  toggleOpen: () => void;
  setOpen: (isOpen: boolean) => void;
  clearHistory: () => Promise<void>;
}

const KaizechChatContext = createContext<KaizechChatContextValue | null>(null);

export interface KaizechChatProviderProps extends ChatEngineConfig {
  children: React.ReactNode;
}

export const KaizechChatProvider: React.FC<KaizechChatProviderProps> = ({
  children,
  apiUrl,
  apiKey,
  sessionId,
  theme,
  userMetadata,
  storage,
}) => {
  const engine = useMemo(() => {
    return new KaizechChatEngine({
      apiUrl,
      apiKey,
      sessionId,
      theme,
      userMetadata,
      storage,
    });
  }, [apiUrl, apiKey, sessionId]);

  const [state, setState] = useState<ChatState>(() => engine.getState());

  useEffect(() => {
    const unsub = engine.on('state_change', (newState: ChatState) => {
      setState(newState);
    });
    return () => unsub();
  }, [engine]);

  const value = useMemo(
    () => ({
      engine,
      state,
      sendMessage: (msg: string) => engine.sendMessage(msg),
      toggleOpen: () => engine.toggleOpen(),
      setOpen: (open: boolean) => engine.setOpen(open),
      clearHistory: () => engine.clearHistory(),
    }),
    [engine, state]
  );

  return (
    <KaizechChatContext.Provider value={value}>
      {children}
    </KaizechChatContext.Provider>
  );
};

export const useKaizechChat = (): KaizechChatContextValue => {
  const context = useContext(KaizechChatContext);
  if (!context) {
    throw new Error('useKaizechChat must be used within a KaizechChatProvider');
  }
  return context;
};
