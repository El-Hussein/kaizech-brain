import { KaizechChatEngine, ChatEngineConfig, ChatState } from '@kaizech/chat-core';
import { WIDGET_STYLES } from './widget-styles';

export class KaizechChatWidgetElement extends HTMLElement {
  private shadow: ShadowRoot;
  private engine!: KaizechChatEngine;
  private state!: ChatState;

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
      this.state = newState;
      this.updateUI();
    });
  }

  private render() {
    const config = this.engine.getConfig();
    const theme = config.theme || {};
    const posClass = theme.position === 'bottom-left' ? 'left' : '';

    this.shadow.innerHTML = `
      <style>
        ${WIDGET_STYLES}
        :host {
          --primary-color: ${theme.primaryColor || '#0066FF'};
        }
      </style>

      <button class="kaizech-launcher-button ${posClass}" id="launcher">
        <svg class="kaizech-launcher-icon" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
        </svg>
      </button>

      <div class="kaizech-window ${posClass}" id="window">
        <div class="kaizech-header">
          <div class="kaizech-header-title">
            <div class="kaizech-avatar">🤖</div>
            <div class="kaizech-header-info">
              <h4>${theme.botTitle || 'AI Assistant'}</h4>
              <p>Online</p>
            </div>
          </div>
          <button class="kaizech-close-btn" id="closeBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="kaizech-messages" id="messagesList"></div>

        <div class="kaizech-suggestions" id="suggestions"></div>

        <form class="kaizech-input-area" id="chatForm">
          <input 
            type="text" 
            class="kaizech-input" 
            id="chatInput" 
            placeholder="${theme.placeholderText || 'Type your message...'}" 
            autocomplete="off"
          />
          <button type="submit" class="kaizech-send-btn" id="sendBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>

        <div class="kaizech-footer">
          Powered by Kaizech Brain AI
        </div>
      </div>
    `;

    // Bind event listeners
    const launcher = this.shadow.getElementById('launcher');
    const closeBtn = this.shadow.getElementById('closeBtn');
    const chatForm = this.shadow.getElementById('chatForm');
    const chatInput = this.shadow.getElementById('chatInput') as HTMLInputElement;

    launcher?.addEventListener('click', () => this.engine.toggleOpen());
    closeBtn?.addEventListener('click', () => this.engine.setOpen(false));

    chatForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value;
      if (text) {
        this.engine.sendMessage(text);
        chatInput.value = '';
      }
    });

    this.updateUI();
  }

  private updateUI() {
    const windowEl = this.shadow.getElementById('window');
    const messagesList = this.shadow.getElementById('messagesList');
    const suggestionsEl = this.shadow.getElementById('suggestions');

    if (!windowEl || !messagesList) return;

    if (this.state.isOpen) {
      windowEl.classList.add('open');
    } else {
      windowEl.classList.remove('open');
    }

    // Render messages
    messagesList.innerHTML = this.state.messages
      .map(
        (m) => `
        <div class="kaizech-msg-bubble ${m.sender}">
          ${this.escapeHtml(m.content)}
        </div>
      `
      )
      .join('');

    if (this.state.isStreaming || this.state.isTyping) {
      const typingEl = document.createElement('div');
      typingEl.className = 'kaizech-typing-indicator';
      typingEl.innerHTML = `
        <div class="kaizech-typing-dot"></div>
        <div class="kaizech-typing-dot"></div>
        <div class="kaizech-typing-dot"></div>
      `;
      messagesList.appendChild(typingEl);
    }

    // Scroll to bottom
    messagesList.scrollTop = messagesList.scrollHeight;

    // Render suggestions chips if messages length <= 1
    if (suggestionsEl) {
      const suggestions = this.engine.getConfig().theme?.suggestedQuestions || [];
      if (this.state.messages.length <= 1 && suggestions.length > 0) {
        suggestionsEl.style.display = 'flex';
        suggestionsEl.innerHTML = suggestions
          .map(
            (q) => `
            <div class="kaizech-suggestion-chip" data-question="${this.escapeHtml(q)}">
              ${this.escapeHtml(q)}
            </div>
          `
          )
          .join('');

        suggestionsEl.querySelectorAll('.kaizech-suggestion-chip').forEach((chip) => {
          chip.addEventListener('click', (e: any) => {
            const q = e.target.getAttribute('data-question');
            if (q) this.engine.sendMessage(q);
          });
        });
      } else {
        suggestionsEl.style.display = 'none';
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
