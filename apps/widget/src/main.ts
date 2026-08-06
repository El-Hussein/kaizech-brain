import './widget-element';
import { KaizechChatWidgetElement } from './widget-element';

declare global {
  interface Window {
    KaizechChatConfig?: any;
    KaizechChatWidget?: any;
  }
}

function autoInitWidget() {
  if (typeof window === 'undefined') return;

  const scriptTag = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const datasetApiKey = scriptTag ? (scriptTag as HTMLScriptElement).dataset.apiKey : null;
  const datasetApiUrl = scriptTag ? (scriptTag as HTMLScriptElement).dataset.apiUrl : null;

  const globalConfig = window.KaizechChatConfig || {};
  const apiKey = globalConfig.apiKey || datasetApiKey;
  const apiUrl = globalConfig.apiUrl || datasetApiUrl || 'http://localhost:3000';

  if (!apiKey) {
    console.warn('⚠️ Kaizech Chatbot Widget: Missing apiKey in window.KaizechChatConfig or data-api-key attribute.');
    return;
  }

  const widgetEl = document.createElement('kaizech-chat-widget') as KaizechChatWidgetElement;
  document.body.appendChild(widgetEl);

  widgetEl.init({
    apiUrl,
    apiKey,
    theme: globalConfig.theme,
    userMetadata: globalConfig.user,
  });

  window.KaizechChatWidget = widgetEl;
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  autoInitWidget();
} else {
  window.addEventListener('DOMContentLoaded', autoInitWidget);
}
