import React, { useState } from 'react';
import { Code2, Copy, Check, Smartphone, Globe, Terminal } from 'lucide-react';

interface WidgetConfiguratorTabProps {
  apiKey: string;
  tenantName: string;
}

export const WidgetConfiguratorTab: React.FC<WidgetConfiguratorTabProps> = ({
  apiKey,
  tenantName,
}) => {
  const [primaryColor, setPrimaryColor] = useState('#0066FF');
  const [botTitle, setBotTitle] = useState(`${tenantName} AI Support`);
  const [welcomeMessage, setWelcomeMessage] = useState(
    `Hello! Welcome to ${tenantName}. How can I help you today?`
  );
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [activeSnippetTab, setActiveSnippetTab] = useState<'script' | 'react' | 'rn' | 'api'>(
    'script'
  );
  const [copied, setCopied] = useState(false);

  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'https://kaizech-brain-production.up.railway.app';

  const scriptSnippet = `<!-- Kaizech AI Chatbot Script -->
<script>
  window.KaizechChatConfig = {
    apiUrl: "${apiUrl}",
    apiKey: "${apiKey}",
    theme: {
      primaryColor: "${primaryColor}",
      position: "${position}",
      botTitle: "${botTitle}",
      welcomeMessage: "${welcomeMessage}"
    }
  };
</script>
<script src="${apiUrl}/widget.js" async defer></script>`;

  const reactSnippet = `// 1. Configure .npmrc for GitHub Packages:
// @husseinsalah96:registry=https://npm.pkg.github.com
// 2. Install package:
// npm install @husseinsalah96/chat-react

import React from 'react';
import { KaizechChatProvider, ChatWidget } from '@husseinsalah96/chat-react';

export default function App() {
  return (
    <KaizechChatProvider
      apiUrl="${apiUrl}"
      apiKey="${apiKey}"
      theme={{
        primaryColor: "${primaryColor}",
        position: "${position}",
        botTitle: "${botTitle}",
        welcomeMessage: "${welcomeMessage}"
      }}
    >
      <YourAppContent />
      <ChatWidget />
    </KaizechChatProvider>
  );
}`;

  const reactNativeSnippet = `// 1. Configure .npmrc for GitHub Packages:
// @husseinsalah96:registry=https://npm.pkg.github.com
// 2. Install package:
// npm install @husseinsalah96/chat-react-native

import React from 'react';
import { SafeAreaView } from 'react-native';
import { KaizechChatScreen } from '@husseinsalah96/chat-react-native';

export default function SupportScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KaizechChatScreen
        apiUrl="${apiUrl}"
        apiKey="${apiKey}"
        theme={{
          primaryColor: "${primaryColor}",
          botTitle: "${botTitle}",
          welcomeMessage: "${welcomeMessage}"
        }}
      />
    </SafeAreaView>
  );
}`;

  const apiSnippet = `// Direct REST API Call
fetch("${apiUrl}/channels/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${apiKey}"
  },
  body: JSON.stringify({
    message: "Hello, what options are available?",
    sessionId: "user_session_123",
    channel: "api"
  })
})
.then(res => res.json())
.then(data => console.log(data.reply));`;

  const getActiveSnippet = () => {
    switch (activeSnippetTab) {
      case 'script':
        return scriptSnippet;
      case 'react':
        return reactSnippet;
      case 'rn':
        return reactNativeSnippet;
      case 'api':
        return apiSnippet;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          🤖 Embed Chatbot SDK & Widget
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
          Customize your AI chatbot appearance, preview in real-time, and get drop-in SDK code for Any Website, React, React Native, or API.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
        {/* Customization Options */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-main)' }}>
            🎨 Widget Appearance Customizer
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                Primary Brand Color
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                Bot Header Title
              </label>
              <input
                type="text"
                value={botTitle}
                onChange={(e) => setBotTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-main)',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                Welcome Greeting Message
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-main)',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                Screen Position
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setPosition('bottom-right')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: position === 'bottom-right' ? '2px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                    background: position === 'bottom-right' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Bottom Right
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('bottom-left')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: position === 'bottom-left' ? '2px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                    background: position === 'bottom-left' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Bottom Left
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Code Snippets & Embed Options */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-main)' }}>
            ⚡ Embed Code & Integration SDKs
          </h3>
          <div>
            {/* Snippet Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setActiveSnippetTab('script')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: activeSnippetTab === 'script' ? 'var(--accent-primary)' : 'transparent',
                  color: activeSnippetTab === 'script' ? '#FFF' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <Globe size={15} /> JS Script Tag
              </button>
              <button
                type="button"
                onClick={() => setActiveSnippetTab('react')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: activeSnippetTab === 'react' ? 'var(--accent-primary)' : 'transparent',
                  color: activeSnippetTab === 'react' ? '#FFF' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <Code2 size={15} /> React (Web)
              </button>
              <button
                type="button"
                onClick={() => setActiveSnippetTab('rn')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: activeSnippetTab === 'rn' ? 'var(--accent-primary)' : 'transparent',
                  color: activeSnippetTab === 'rn' ? '#FFF' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <Smartphone size={15} /> React Native (Mobile)
              </button>
              <button
                type="button"
                onClick={() => setActiveSnippetTab('api')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: activeSnippetTab === 'api' ? 'var(--accent-primary)' : 'transparent',
                  color: activeSnippetTab === 'api' ? '#FFF' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <Terminal size={15} /> Direct REST API
              </button>
            </div>

            {/* Code Box */}
            <div style={{ position: 'relative', marginTop: '16px' }}>
              <button
                onClick={handleCopy}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <pre
                style={{
                  background: '#0F172A',
                  color: '#E2E8F0',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  overflowX: 'auto',
                  fontFamily: 'Consolas, Monaco, monospace',
                  margin: 0,
                }}
              >
                {getActiveSnippet()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
