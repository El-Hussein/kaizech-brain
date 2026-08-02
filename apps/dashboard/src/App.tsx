import React, { useState } from 'react';
import { LayoutDashboard, Sliders, Database, Wrench, PlayCircle, MessageSquare, Settings, Brain, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { OverviewTab } from './components/OverviewTab';
import { PromptBuilderTab } from './components/PromptBuilderTab';
import { KnowledgeTab } from './components/KnowledgeTab';
import { ToolsTab } from './components/ToolsTab';
import { PlaygroundTab } from './components/PlaygroundTab';
import { ConversationsTab } from './components/ConversationsTab';
import { SettingsTab } from './components/SettingsTab';

axios.defaults.baseURL = (import.meta as any).env?.VITE_API_URL || 'https://kaizech-brain-production.up.railway.app';


class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Component Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', margin: '20px', color: '#f87171' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>⚠️ Tab Error Caught</h3>
          <p style={{ fontSize: '14px', color: '#e5e7eb', fontFamily: 'monospace', margin: '10px 0' }}>{this.state.error?.message || 'An unexpected error occurred while rendering this tab.'}</p>
          <button className="btn btn-secondary" style={{ marginTop: '14px' }} onClick={() => this.setState({ hasError: false, error: null })}>
            🔄 Reload Tab Component
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'prompt' | 'knowledge' | 'tools' | 'playground' | 'conversations' | 'settings'>('overview');
  const [apiKey, setApiKey] = useState('kb_demo_tenant_key');
  const [selectedTenant, setSelectedTenant] = useState('Mrkoon Auctions');

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Brain size={28} /> Kaizech Brain
        </div>

        {/* Tenant Selector */}
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Active Tenant</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '14px' }}>
            <span>{selectedTenant}</span>
            <ChevronDown size={16} color="var(--text-muted)" />
          </div>
        </div>

        {/* Navigation Menu */}
        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <LayoutDashboard size={18} /> Overview
          </li>
          <li className={`nav-item ${activeTab === 'prompt' ? 'active' : ''}`} onClick={() => setActiveTab('prompt')}>
            <Sliders size={18} /> Prompt Builder
          </li>
          <li className={`nav-item ${activeTab === 'knowledge' ? 'active' : ''}`} onClick={() => setActiveTab('knowledge')}>
            <Database size={18} /> Knowledge (RAG)
          </li>
          <li className={`nav-item ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')}>
            <Wrench size={18} /> Tools & API Tester
          </li>
          <li className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`} onClick={() => setActiveTab('playground')}>
            <PlayCircle size={18} /> AI Playground
          </li>
          <li className={`nav-item ${activeTab === 'conversations' ? 'active' : ''}`} onClick={() => setActiveTab('conversations')}>
            <MessageSquare size={18} /> Conversations & Support
          </li>
          <li className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={18} /> Settings & API Keys
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <ErrorBoundary key={activeTab}>
          {activeTab === 'overview' && <OverviewTab apiKey={apiKey} />}
          {activeTab === 'prompt' && <PromptBuilderTab apiKey={apiKey} />}
          {activeTab === 'knowledge' && <KnowledgeTab apiKey={apiKey} />}
          {activeTab === 'tools' && <ToolsTab apiKey={apiKey} />}
          {activeTab === 'playground' && <PlaygroundTab apiKey={apiKey} />}
          {activeTab === 'conversations' && <ConversationsTab apiKey={apiKey} />}
          {activeTab === 'settings' && <SettingsTab apiKey={apiKey} />}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;

