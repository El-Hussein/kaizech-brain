import { KaizechChatEngine, ChatEngineConfig, ChatState } from '@kaizech/chat-core';
import { WIDGET_STYLES } from './widget-styles';

export class KaizechChatWidgetElement extends HTMLElement {
  private shadow: ShadowRoot;
  private engine!: KaizechChatEngine;
  private state!: ChatState;
  private unreadCount = 0;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  public init(config: ChatEngineConfig) {
    this.engine = new KaizechChatEngine(config);
    this.state = this.engine.getState();

    this.render();
    this.setupListeners();
  }

  private setupListeners() {
    this.engine.on('state_change', (newState: ChatState) => {
      const wasOpen = this.state.isOpen;
      this.state = newState;

      // Track unread when panel is closed
      if (!newState.isOpen && newState.messages.length > 0) {
        const lastMsg = newState.messages[newState.messages.length - 1];
        if (lastMsg.sender === 'assistant') {
          this.unreadCount++;
        }
      } else if (newState.isOpen) {
        this.unreadCount = 0;
      }

      this.updateUI();
    });
  }

  private robotSVG() {
    return `
      <svg class="k-robot-body" viewBox="0 0 68 68" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#5B5FEF"/>
            <stop offset="100%" stop-color="#7C7FF5"/>
          </linearGradient>
          <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0D0F1C"/>
            <stop offset="100%" stop-color="#1A1D35"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <!-- Antenna -->
        <line x1="34" y1="8" x2="34" y2="16" stroke="#5B5FEF" stroke-width="2.5" stroke-linecap="round"/>
        <circle class="k-antenna-light" cx="34" cy="5.5" r="3" fill="#00E5C3" filter="url(#glow)"/>

        <!-- Head / body -->
        <rect x="12" y="17" width="44" height="38" rx="12" fill="url(#bodyGrad)"/>

        <!-- Face panel -->
        <rect x="17" y="22" width="34" height="26" rx="8" fill="url(#faceGrad)"/>

        <!-- Eyes -->
        <g class="k-eye-left">
          <rect x="21" y="29" width="10" height="10" rx="3" fill="#5B5FEF" opacity="0.25"/>
          <rect x="23" y="31" width="6" height="6" rx="2" fill="#00E5C3" opacity="0.9"/>
          <circle cx="25" cy="33" r="1.5" fill="#fff"/>
        </g>
        <g class="k-eye-right">
          <rect x="37" y="29" width="10" height="10" rx="3" fill="#5B5FEF" opacity="0.25"/>
          <rect x="39" y="31" width="6" height="6" rx="2" fill="#00E5C3" opacity="0.9"/>
          <circle cx="41" cy="33" r="1.5" fill="#fff"/>
        </g>

        <!-- Mouth -->
        <path class="k-mouth-line"
          d="M24 43 Q34 48 44 43"
          stroke="#00E5C3" stroke-width="2" fill="none" stroke-linecap="round"
        />

        <!-- Ears -->
        <rect x="6"  y="25" width="7" height="14" rx="3.5" fill="url(#bodyGrad)" opacity="0.8"/>
        <rect x="55" y="25" width="7" height="14" rx="3.5" fill="url(#bodyGrad)" opacity="0.8"/>

        <!-- Signal rings (animated) -->
        <circle cx="61" cy="27" r="2" fill="#00E5C3" opacity="0.8" class="k-antenna-light"/>
      </svg>
    `;
  }

  private render() {
    const config = this.engine.getConfig();
    const theme = config.theme || {};
    const posClass = theme.position === 'bottom-left' ? 'left' : '';
    const botTitle = theme.botTitle || 'AI Assistant';

    this.shadow.innerHTML = `
      <style>
        ${WIDGET_STYLES}
        :host {
          --primary: ${theme.primaryColor || '#5B5FEF'};
          --primary-light: ${theme.primaryColor ? theme.primaryColor + 'cc' : '#7C7FF5'};
          --primary-glow: ${theme.primaryColor ? theme.primaryColor + '70' : 'rgba(91, 95, 239, 0.45)'};
        }
      </style>

      <!-- Robot launcher button -->
      <button class="k-launcher ${posClass}" id="launcher" aria-label="Open chat">
        ${this.robotSVG()}
        <span class="k-badge" id="badge" hidden>0</span>
      </button>

      <!-- Chat panel -->
      <div class="k-panel ${posClass}" id="panel" role="dialog" aria-label="Chat window">

        <!-- Header -->
        <div class="k-header">
          <div class="k-header-left">
            <div class="k-header-avatar">🤖</div>
            <div>
              <p class="k-header-name">${this.escapeHtml(botTitle)}</p>
              <div class="k-header-status">
                <span class="k-status-dot"></span>
                <span class="k-status-text">Online</span>
              </div>
            </div>
          </div>
          <button class="k-close-btn" id="closeBtn" aria-label="Close chat">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <line x1="1" y1="1" x2="13" y2="13"/>
              <line x1="13" y1="1" x2="1" y2="13"/>
            </svg>
          </button>
        </div>

        <!-- Messages -->
        <div class="k-messages" id="messagesList"></div>

        <!-- Suggestion chips -->
        <div class="k-suggestions" id="suggestions" style="display:none"></div>

        <!-- Input -->
        <form class="k-input-area" id="chatForm">
          <input
            type="text"
            class="k-input"
            id="chatInput"
            placeholder="${this.escapeHtml(theme.placeholderText || 'Ask me anything…')}"
            autocomplete="off"
          />
          <button type="submit" class="k-send-btn" id="sendBtn" aria-label="Send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>

        <!-- Footer -->
        <div class="k-footer">Powered by Kaizech Brain AI ✦</div>
      </div>
    `;

    // Events
    const launcher = this.shadow.getElementById('launcher');
    const closeBtn = this.shadow.getElementById('closeBtn');
    const chatForm = this.shadow.getElementById('chatForm');
    const chatInput = this.shadow.getElementById('chatInput') as HTMLInputElement;

    launcher?.addEventListener('click', () => {
      this.unreadCount = 0;
      this.engine.toggleOpen();
    });

    closeBtn?.addEventListener('click', () => this.engine.setOpen(false));

    chatForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (text) {
        this.engine.sendMessage(text);
        chatInput.value = '';
      }
    });

    this.updateUI();
  }

  private updateUI() {
    const panel      = this.shadow.getElementById('panel');
    const launcher   = this.shadow.getElementById('launcher');
    const messages   = this.shadow.getElementById('messagesList');
    const suggestions = this.shadow.getElementById('suggestions');
    const badge      = this.shadow.getElementById('badge');

    if (!panel || !messages) return;

    // Panel open / close
    if (this.state.isOpen) {
      panel.classList.add('open');
      launcher?.classList.add('is-open');
    } else {
      panel.classList.remove('open');
      launcher?.classList.remove('is-open');
    }

    // Unread badge
    if (badge) {
      if (this.unreadCount > 0 && !this.state.isOpen) {
        badge.textContent = String(this.unreadCount > 9 ? '9+' : this.unreadCount);
        badge.removeAttribute('hidden');
      } else {
        badge.setAttribute('hidden', '');
      }
    }

    // Messages or welcome state
    if (this.state.messages.length === 0) {
      messages.innerHTML = `
        <div class="k-welcome">
          <div class="k-welcome-emoji">🤖</div>
          <p class="k-welcome-title">Hey there! 👋</p>
          <p class="k-welcome-sub">I'm your AI assistant. Ask me anything — I'm here to help!</p>
        </div>
      `;
    } else {
      messages.innerHTML = this.state.messages
        .map(
          (m) => `
          <div class="k-bubble ${m.sender}">
            ${this.escapeHtml(m.content)}
          </div>
        `
        )
        .join('');

      if (this.state.isStreaming || this.state.isTyping) {
        const typing = document.createElement('div');
        typing.className = 'k-typing';
        typing.innerHTML = `
          <div class="k-dot"></div>
          <div class="k-dot"></div>
          <div class="k-dot"></div>
        `;
        messages.appendChild(typing);
      }

      messages.scrollTop = messages.scrollHeight;
    }

    // Suggestion chips
    if (suggestions) {
      const chips = this.engine.getConfig().theme?.suggestedQuestions || [];
      if (this.state.messages.length <= 1 && chips.length > 0) {
        suggestions.style.display = 'flex';
        suggestions.innerHTML = chips
          .map(
            (q) =>
              `<div class="k-chip" data-question="${this.escapeHtml(q)}">${this.escapeHtml(q)}</div>`
          )
          .join('');

        suggestions.querySelectorAll('.k-chip').forEach((chip) => {
          chip.addEventListener('click', (e: any) => {
            const q = e.currentTarget.getAttribute('data-question');
            if (q) this.engine.sendMessage(q);
          });
        });
      } else {
        suggestions.style.display = 'none';
      }
    }
  }

  private escapeHtml(str: string) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

if (!customElements.get('kaizech-chat-widget')) {
  customElements.define('kaizech-chat-widget', KaizechChatWidgetElement);
}
