import React, { useState } from 'react';
import { LayoutDashboard, Sliders, Database, Wrench, PlayCircle, MessageSquare, Settings, Brain, ChevronDown } from 'lucide-react';
import { OverviewTab } from './components/OverviewTab';
import { PromptBuilderTab } from './components/PromptBuilderTab';
import { KnowledgeTab } from './components/KnowledgeTab';
import { ToolsTab } from './components/ToolsTab';
import { PlaygroundTab } from './components/PlaygroundTab';
import { ConversationsTab } from './components/ConversationsTab';
import { SettingsTab } from './components/SettingsTab';

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
        {activeTab === 'overview' && <OverviewTab apiKey={apiKey} />}
        {activeTab === 'prompt' && <PromptBuilderTab apiKey={apiKey} />}
        {activeTab === 'knowledge' && <KnowledgeTab apiKey={apiKey} />}
        {activeTab === 'tools' && <ToolsTab apiKey={apiKey} />}
        {activeTab === 'playground' && <PlaygroundTab apiKey={apiKey} />}
        {activeTab === 'conversations' && <ConversationsTab apiKey={apiKey} />}
        {activeTab === 'settings' && <SettingsTab apiKey={apiKey} />}
      </main>
    </div>
  );
};

export default App;
