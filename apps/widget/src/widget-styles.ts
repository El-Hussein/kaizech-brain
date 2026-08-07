export const WIDGET_STYLES = `
:host {
  --primary:       #5B5FEF;
  --primary-light: #7C7FF5;
  --primary-glow:  rgba(91, 95, 239, 0.45);
  --accent:        #00E5C3;
  --bg-panel:      #0D0F1C;
  --bg-msg:        #161828;
  --bg-user-msg:   var(--primary);
  --text-main:     #E8EAFF;
  --text-muted:    #6B6F9A;
  --border:        rgba(255,255,255,0.07);
  --radius-panel:  20px;
  --radius-bubble: 18px;

  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

*, *:before, *:after { box-sizing: inherit; }

/* ── Robot launcher ──────────────────────────────────────────────── */
.k-launcher {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 68px;
  height: 68px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 2147483640;
  animation: k-float 3s ease-in-out infinite;
  filter: drop-shadow(0 8px 20px var(--primary-glow));
  transition: filter 0.3s ease;
}

.k-launcher.left { right: auto; left: 28px; }

.k-launcher:hover {
  filter: drop-shadow(0 12px 30px var(--primary-glow)) brightness(1.08);
  animation-play-state: paused;
}

.k-launcher:hover .k-robot-body {
  transform: scale(1.06);
}

.k-launcher.is-open {
  animation-play-state: paused;
}

/* Floating keyframe */
@keyframes k-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}

/* ── Robot SVG parts ─────────────────────────────────────────────── */
.k-robot-body {
  width: 68px;
  height: 68px;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Antenna blink */
.k-antenna-light {
  animation: k-blink 2s ease-in-out infinite;
}

@keyframes k-blink {
  0%, 90%, 100% { opacity: 1; r: 3; }
  95%            { opacity: 0.2; r: 2; }
}

/* Eye scan */
.k-eye-left, .k-eye-right {
  animation: k-eye-scan 4s ease-in-out infinite;
}
.k-eye-right { animation-delay: 0.2s; }

@keyframes k-eye-scan {
  0%, 80%, 100% { transform: translateX(0); }
  40%            { transform: translateX(2px); }
  60%            { transform: translateX(-1px); }
}

/* Mouth when open: show smile */
.k-mouth-line {
  transition: d 0.3s ease;
}

/* ── Chat panel ──────────────────────────────────────────────────── */
.k-panel {
  position: fixed;
  bottom: 108px;
  right: 28px;
  width: 380px;
  max-width: calc(100vw - 40px);
  height: 560px;
  max-height: calc(100vh - 130px);
  background: var(--bg-panel);
  border-radius: var(--radius-panel);
  border: 1px solid var(--border);
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255,255,255,0.05),
    inset 0 1px 0 rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateY(16px) scale(0.96);
  transform-origin: bottom right;
  pointer-events: none;
  transition:
    opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2147483639;
}

.k-panel.left {
  right: auto;
  left: 28px;
  transform-origin: bottom left;
}

.k-panel.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

/* ── Panel header ────────────────────────────────────────────────── */
.k-header {
  padding: 16px 18px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(91,95,239,0.25) 0%, rgba(0,229,195,0.1) 100%);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.k-header-left {
  display: flex;
  align-items: center;
  gap: 11px;
}

.k-header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px var(--primary-glow);
}

.k-header-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  line-height: 1.2;
}

.k-header-status {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
}

.k-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent);
  animation: k-pulse-dot 2s ease-in-out infinite;
}

@keyframes k-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(0.8); }
}

.k-status-text {
  font-size: 11px;
  color: var(--accent);
  font-weight: 500;
}

.k-close-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.k-close-btn:hover {
  background: rgba(255,255,255,0.12);
  color: var(--text-main);
  border-color: rgba(255,255,255,0.15);
}

/* ── Messages area ───────────────────────────────────────────────── */
.k-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg-panel);
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.k-messages::-webkit-scrollbar { width: 4px; }
.k-messages::-webkit-scrollbar-track { background: transparent; }
.k-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

/* Welcome state (empty messages) */
.k-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  padding: 24px 16px;
  text-align: center;
  animation: k-fade-in 0.4s ease;
}

.k-welcome-emoji {
  font-size: 48px;
  line-height: 1;
  animation: k-float 2.5s ease-in-out infinite;
}

.k-welcome-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.k-welcome-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
  max-width: 240px;
  line-height: 1.5;
}

@keyframes k-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Message bubbles ─────────────────────────────────────────────── */
.k-bubble {
  max-width: 80%;
  padding: 11px 15px;
  border-radius: var(--radius-bubble);
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  animation: k-bubble-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes k-bubble-in {
  from { opacity: 0; transform: scale(0.85) translateY(6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.k-bubble.user {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: #fff;
  border-bottom-right-radius: 5px;
  box-shadow: 0 4px 12px var(--primary-glow);
}

.k-bubble.assistant {
  align-self: flex-start;
  background: var(--bg-msg);
  color: var(--text-main);
  border: 1px solid var(--border);
  border-bottom-left-radius: 5px;
}

/* Typing dots */
.k-typing {
  display: flex;
  gap: 5px;
  padding: 12px 16px;
  align-self: flex-start;
  background: var(--bg-msg);
  border: 1px solid var(--border);
  border-radius: var(--radius-bubble);
  border-bottom-left-radius: 5px;
  animation: k-bubble-in 0.22s ease both;
}

.k-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary-light);
  animation: k-bounce 1.2s ease-in-out infinite;
}

.k-dot:nth-child(1) { animation-delay: 0s; }
.k-dot:nth-child(2) { animation-delay: 0.15s; }
.k-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes k-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30%            { transform: translateY(-6px); }
}

/* ── Suggestions ─────────────────────────────────────────────────── */
.k-suggestions {
  padding: 6px 16px 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  background: var(--bg-panel);
  flex-shrink: 0;
}

.k-chip {
  background: rgba(91, 95, 239, 0.12);
  border: 1px solid rgba(91, 95, 239, 0.35);
  color: var(--primary-light);
  padding: 6px 13px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.k-chip:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px var(--primary-glow);
}

/* ── Input area ──────────────────────────────────────────────────── */
.k-input-area {
  padding: 12px 14px;
  background: var(--bg-msg);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 9px;
  flex-shrink: 0;
}

.k-input {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 15px;
  font-size: 14px;
  color: var(--text-main);
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  font-family: inherit;
}

.k-input::placeholder { color: var(--text-muted); }

.k-input:focus {
  border-color: rgba(91, 95, 239, 0.6);
  background: rgba(91, 95, 239, 0.06);
}

.k-send-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
  box-shadow: 0 4px 12px var(--primary-glow);
}

.k-send-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 18px var(--primary-glow);
}

.k-send-btn:active { transform: scale(0.96); }

/* ── Footer ──────────────────────────────────────────────────────── */
.k-footer {
  text-align: center;
  padding: 7px;
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-msg);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

/* ── Notification badge ──────────────────────────────────────────── */
.k-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #FF4D6D;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  animation: k-badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

.k-badge[hidden] { display: none; }

@keyframes k-badge-pop {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}
`;
