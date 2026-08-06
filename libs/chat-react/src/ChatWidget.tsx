import React, { useState } from 'react';
import { useKaizechChat } from './KaizechChatContext';

export interface ChatWidgetProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ className, style }) => {
  const { engine, state, sendMessage, toggleOpen, setOpen } = useKaizechChat();
  const [inputText, setInputText] = useState('');

  if (!engine) return null;

  const config = engine.getConfig();
  const theme = config.theme || {};
  const primaryColor = theme.primaryColor || '#0066FF';
  const isLeft = theme.position === 'bottom-left';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div style={{ zIndex: 99999, ...style }} className={className}>
      {/* Floating Launcher Button */}
      <button
        onClick={toggleOpen}
        style={{
          position: 'fixed',
          bottom: 24,
          right: isLeft ? 'auto' : 24,
          left: isLeft ? 24 : 'auto',
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: primaryColor,
          color: '#FFF',
          border: 'none',
          boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z" />
        </svg>
      </button>

      {/* Chat Window */}
      {state.isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 96,
            right: isLeft ? 'auto' : 24,
            left: isLeft ? 24 : 'auto',
            width: 380,
            maxWidth: 'calc(100vw - 32px)',
            height: 600,
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: theme.backgroundColor || '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: primaryColor,
              color: '#FFF',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                🤖
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                  {theme.botTitle || 'AI Assistant'}
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, opacity: 0.85 }}>Online</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFF',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              backgroundColor: '#F8FAFC',
            }}
          >
            {state.messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    fontSize: 14,
                    lineHeight: 1.45,
                    backgroundColor: isUser ? primaryColor : '#F1F5F9',
                    color: isUser ? '#FFFFFF' : '#1E293B',
                    borderBottomRightRadius: isUser ? 4 : 14,
                    borderBottomLeftRadius: isUser ? 14 : 4,
                  }}
                >
                  {m.content}
                </div>
              );
            })}
            {(state.isStreaming || state.isTyping) && (
              <div style={{ alignSelf: 'flex-start', fontSize: 12, color: '#94A3B8' }}>
                Typing...
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '12px 16px',
              backgroundColor: '#FFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={theme.placeholderText || 'Type your message...'}
              style={{
                flex: 1,
                borderRadius: 20,
                border: '1px solid #E2E8F0',
                padding: '10px 16px',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: primaryColor,
                color: '#FFF',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
