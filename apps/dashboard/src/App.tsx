import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Sliders,
  Database,
  Wrench,
  PlayCircle,
  MessageSquare,
  Settings,
  Brain,
  ChevronDown,
  Building2,
  Lock,
} from 'lucide-react';
import axios from 'axios';
import { OverviewTab } from './components/OverviewTab';
import { PromptBuilderTab } from './components/PromptBuilderTab';
import { KnowledgeTab } from './components/KnowledgeTab';
import { ToolsTab } from './components/ToolsTab';
import { PlaygroundTab } from './components/PlaygroundTab';
import { ConversationsTab } from './components/ConversationsTab';
import { SettingsTab } from './components/SettingsTab';

axios.defaults.baseURL =
  (import.meta as any).env?.VITE_API_URL || 'https://kaizech-brain-production.up.railway.app';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '30px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            margin: '20px',
            color: '#f87171',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>
            ⚠️ Tab Error Caught
          </h3>
          <p style={{ fontSize: '14px', color: '#e5e7eb', fontFamily: 'monospace', margin: '10px 0' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this tab.'}
          </p>
          <button
            className="btn btn-secondary"
            style={{ marginTop: '14px' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            🔄 Reload Tab Component
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'prompt' | 'knowledge' | 'tools' | 'playground' | 'conversations' | 'settings'
  >('overview');

  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState<string>('mrkoon');
  const [apiKey, setApiKey] = useState('kb_demo_tenant_key');
  const [tenantName, setTenantName] = useState('Mrkoon Auctions');

  useEffect(() => {
    // Check URL search params for tenant switching from Admin Console
    const urlParams = new URLSearchParams(window.location.search);
    const paramTenant = urlParams.get('tenant');
    const paramKey = urlParams.get('apiKey');

    if (paramKey) {
      setApiKey(paramKey);
    }

    fetchTenantsList(paramTenant, paramKey);
  }, []);

  const fetchTenantsList = async (targetSlug?: string | null, targetApiKey?: string | null) => {
    try {
      const res = await axios.get('/api/v1/tenants');
      const list = res.data || [];
      if (list.length > 0) {
        setTenants(list);
        const match = targetSlug ? list.find((t: any) => t.slug === targetSlug) : list[0];
        if (match) {
          setSelectedTenantSlug(match.slug);
          setTenantName(match.name);
          if (!targetApiKey) {
            setApiKey(match.apiKey || 'kb_demo_tenant_key');
          }
        }
      }
    } catch {
      // Mock fallback tenant list
      const mockList = [
        { id: 't-1', name: 'Mrkoon Auctions', slug: 'mrkoon', apiKey: 'kb_demo_tenant_key' },
        { id: 't-2', name: 'E-Nursery Schools', slug: 'e-nursery', apiKey: 'kb_live_sk_enursery' },
        { id: 't-3', name: 'City Care Hospital', slug: 'city-care', apiKey: 'kb_live_sk_citycare' },
      ];
      setTenants(mockList);
      if (targetSlug) {
        const match = mockList.find((t) => t.slug === targetSlug);
        if (match) {
          setSelectedTenantSlug(match.slug);
          setTenantName(match.name);
        }
      }
    }
  };

  const handleSelectTenant = (slug: string) => {
    setSelectedTenantSlug(slug);
    const found = tenants.find((t) => t.slug === slug);
    if (found) {
      setTenantName(found.name);
      setApiKey(found.apiKey || 'kb_demo_tenant_key');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Brain size={28} /> Kaizech Brain
        </div>

        {/* Dynamic Tenant Switcher Dropdown */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid var(--border-glass)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Building2 size={12} /> Active Tenant Workspace
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedTenantSlug}
              onChange={(e) => handleSelectTenant(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                padding: '8px 30px 8px 10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
              }}
            >
              {tenants.length > 0 ? (
                tenants.map((t) => (
                  <option key={t.id || t.slug} value={t.slug} style={{ background: '#0f172a', color: '#fff' }}>
                    {t.name} ({t.slug})
                  </option>
                ))
              ) : (
                <option value="mrkoon" style={{ background: '#0f172a', color: '#fff' }}>
                  Mrkoon Auctions
                </option>
              )}
            </select>
            <ChevronDown
              size={16}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <ul className="nav-menu">
          <li
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} /> Overview
          </li>
          <li
            className={`nav-item ${activeTab === 'prompt' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompt')}
          >
            <Sliders size={18} /> Prompt Builder
          </li>
          <li
            className={`nav-item ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => setActiveTab('knowledge')}
          >
            <Database size={18} /> Knowledge (RAG)
          </li>
          <li
            className={`nav-item ${activeTab === 'tools' ? 'active' : ''}`}
            onClick={() => setActiveTab('tools')}
          >
            <Wrench size={18} /> Tools & API Tester
          </li>
          <li
            className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`}
            onClick={() => setActiveTab('playground')}
          >
            <PlayCircle size={18} /> AI Playground
          </li>
          <li
            className={`nav-item ${activeTab === 'conversations' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversations')}
          >
            <MessageSquare size={18} /> Conversations & Support
          </li>
          <li
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} /> Settings & API Keys
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <ErrorBoundary key={`${activeTab}-${selectedTenantSlug}`}>
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
