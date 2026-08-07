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
  const primaryColor = theme.primaryColor || '#5B5FEF';
  const isLeft = theme.position === 'bottom-left';
  const suggestedQuestions = theme.suggestedQuestions || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleChipClick = (q: string) => {
    sendMessage(q);
  };

  return (
    <div style={{ zIndex: 2147483640, ...style }} className={className}>
      {/* Floating Robot Launcher Button */}
      <button
        onClick={toggleOpen}
        aria-label="Open AI Support Chat"
        style={{
          position: 'fixed',
          bottom: 28,
          right: isLeft ? 'auto' : 28,
          left: isLeft ? 28 : 'auto',
          width: 68,
          height: 68,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          zIndex: 2147483640,
          filter: `drop-shadow(0 8px 20px ${primaryColor}70)`,
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="34" y1="8" x2="34" y2="16" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="34" cy="5.5" r="3" fill="#00E5C3"/>
          <rect x="12" y="17" width="44" height="38" rx="12" fill={primaryColor}/>
          <rect x="17" y="22" width="34" height="26" rx="8" fill="#0D0F1C"/>
          <g>
            <rect x="21" y="29" width="10" height="10" rx="3" fill={primaryColor} opacity="0.25"/>
            <rect x="23" y="31" width="6" height="6" rx="2" fill="#00E5C3" opacity="0.9"/>
            <circle cx="25" cy="33" r="1.5" fill="#fff"/>
          </g>
          <g>
            <rect x="37" y="29" width="10" height="10" rx="3" fill={primaryColor} opacity="0.25"/>
            <rect x="39" y="31" width="6" height="6" rx="2" fill="#00E5C3" opacity="0.9"/>
            <circle cx="41" cy="33" r="1.5" fill="#fff"/>
          </g>
          <path d="M24 43 Q34 48 44 43" stroke="#00E5C3" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <rect x="6" y="25" width="7" height="14" rx="3.5" fill={primaryColor} opacity="0.8"/>
          <rect x="55" y="25" width="7" height="14" rx="3.5" fill={primaryColor} opacity="0.8"/>
        </svg>
      </button>

      {/* Chat Window Panel */}
      {state.isOpen && (
        <div
          role="dialog"
          aria-label="Chat window"
          style={{
            position: 'fixed',
            bottom: 108,
            right: isLeft ? 'auto' : 28,
            left: isLeft ? 28 : 'auto',
            width: 380,
            maxWidth: 'calc(100vw - 40px)',
            height: 560,
            maxHeight: 'calc(100vh - 130px)',
            backgroundColor: '#0D0F1C',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            zIndex: 2147483639,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 18px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(91,95,239,0.25) 0%, rgba(0,229,195,0.1) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${primaryColor} 0%, #00E5C3 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  boxShadow: `0 4px 12px ${primaryColor}70`,
                }}
              >
                🤖
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#E8EAFF' }}>
                  {theme.botTitle || 'AI Assistant'}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#00E5C3', boxShadow: '0 0 6px #00E5C3' }} />
                  <span style={{ fontSize: 11, color: '#00E5C3', fontWeight: 500 }}>Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#6B6F9A',
                cursor: 'pointer',
                width: 32,
                height: 32,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages List */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              backgroundColor: '#0D0F1C',
            }}
          >
            {state.messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1, textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: 48, lineHeight: 1 }}>🤖</div>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#E8EAFF', margin: 0 }}>Hey there! 👋</p>
                <p style={{ fontSize: 13, color: '#6B6F9A', margin: 0, maxWidth: 240, lineHeight: 1.5 }}>I'm your AI assistant. Ask me anything — I'm here to help!</p>
              </div>
            ) : (
              state.messages.map((m) => {
                const isUser = m.sender === 'user';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      padding: '11px 15px',
                      borderRadius: 18,
                      fontSize: 14,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      backgroundColor: isUser ? primaryColor : '#161828',
                      color: isUser ? '#FFFFFF' : '#E8EAFF',
                      border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.07)',
                      borderBottomRightRadius: isUser ? 4 : 18,
                      borderBottomLeftRadius: isUser ? 18 : 4,
                      boxShadow: isUser ? `0 4px 12px ${primaryColor}70` : 'none',
                    }}
                  >
                    {m.content}
                  </div>
                );
              })
            )}

            {(state.isStreaming || state.isTyping) && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 14px',
                  borderRadius: 18,
                  borderBottomLeftRadius: 4,
                  backgroundColor: '#161828',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#00E5C3',
                  fontSize: 12,
                }}
              >
                <span>AI is typing...</span>
              </div>
            )}
          </div>

          {/* Suggestion Chips */}
          {state.messages.length <= 1 && suggestedQuestions.length > 0 && (
            <div style={{ padding: '6px 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 7, backgroundColor: '#0D0F1C' }}>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(q)}
                  style={{
                    background: 'rgba(91, 95, 239, 0.12)',
                    border: `1px solid ${primaryColor}60`,
                    color: '#7C7FF5',
                    padding: '6px 13px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '12px 14px',
              backgroundColor: '#161828',
              borderTop: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={theme.placeholderText || 'Ask me anything…'}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                padding: '10px 15px',
                fontSize: 14,
                color: '#E8EAFF',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: primaryColor,
                color: '#FFF',
                border: 'none',
                borderRadius: 12,
                width: 40,
                height: 40,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${primaryColor}70`,
              }}
            >
              ➤
            </button>
          </form>

          {/* Footer Branding */}
          <div style={{ textAlign: 'center', padding: 7, fontSize: 10, color: '#6B6F9A', backgroundColor: '#161828', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            Powered by Kaizech Brain AI ✦
          </div>
        </div>
      )}
    </div>
  );
};
