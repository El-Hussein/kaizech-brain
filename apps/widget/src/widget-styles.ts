export const WIDGET_STYLES = `
:host {
  --primary-color: #0066FF;
  --primary-hover: #0052CC;
  --bg-color: #FFFFFF;
  --text-color: #1E293B;
  --bot-msg-bg: #F1F5F9;
  --user-msg-bg: #0066FF;
  --user-msg-text: #FFFFFF;
  --border-color: #E2E8F0;
  
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-sizing: border-box;
  z-index: 999999;
}

*, *:before, *:after {
  box-sizing: inherit;
}

.kaizech-launcher-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: var(--primary-color);
  color: #FFFFFF;
  border: none;
  box-shadow: 0 8px 24px rgba(0, 102, 255, 0.35);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
  z-index: 999999;
}

.kaizech-launcher-button:hover {
  transform: scale(1.08);
  box-shadow: 0 12px 28px rgba(0, 102, 255, 0.45);
}

.kaizech-launcher-button.left {
  right: auto;
  left: 24px;
}

.kaizech-launcher-icon {
  width: 28px;
  height: 28px;
  fill: currentColor;
  transition: transform 0.2s ease;
}

.kaizech-window {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 380px;
  max-width: calc(100vw - 32px);
  height: 600px;
  max-height: calc(100vh - 120px);
  background: var(--bg-color);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 999998;
}

.kaizech-window.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.kaizech-window.left {
  right: auto;
  left: 24px;
}

.kaizech-header {
  background: var(--primary-color);
  color: #FFFFFF;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kaizech-header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kaizech-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.kaizech-header-info h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.kaizech-header-info p {
  margin: 2px 0 0 0;
  font-size: 12px;
  opacity: 0.85;
}

.kaizech-close-btn {
  background: transparent;
  border: none;
  color: #FFFFFF;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.kaizech-close-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.15);
}

.kaizech-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #F8FAFC;
}

.kaizech-msg-bubble {
  max-width: 82%;
  padding: 12px 16px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.45;
  word-break: break-word;
  white-space: pre-wrap;
}

.kaizech-msg-bubble.user {
  align-self: flex-end;
  background: var(--user-msg-bg);
  color: var(--user-msg-text);
  border-bottom-right-radius: 4px;
}

.kaizech-msg-bubble.assistant {
  align-self: flex-start;
  background: var(--bot-msg-bg);
  color: var(--text-color);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--border-color);
}

.kaizech-typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  align-self: flex-start;
}

.kaizech-typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94A3B8;
  animation: kaizechPulse 1.4s infinite ease-in-out both;
}

.kaizech-typing-dot:nth-child(1) { animation-delay: -0.32s; }
.kaizech-typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes kaizechPulse {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.kaizech-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 12px 16px;
  background: #F8FAFC;
}

.kaizech-suggestion-chip {
  background: #FFFFFF;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.kaizech-suggestion-chip:hover {
  background: var(--primary-color);
  color: #FFFFFF;
}

.kaizech-input-area {
  padding: 12px 16px;
  background: #FFFFFF;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.kaizech-input {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.kaizech-input:focus {
  border-color: var(--primary-color);
}

.kaizech-send-btn {
  background: var(--primary-color);
  color: #FFFFFF;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.kaizech-send-btn:hover {
  background: var(--primary-hover);
}

.kaizech-footer {
  text-align: center;
  padding: 6px;
  font-size: 10px;
  color: #94A3B8;
  background: #FFFFFF;
  border-top: 1px solid #F1F5F9;
}
`;
