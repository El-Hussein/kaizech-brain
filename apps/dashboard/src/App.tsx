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
  Building2,
  Lock,
  LogOut,
  UserCheck,
  ShieldCheck,
  Code2,
} from 'lucide-react';
import axios from 'axios';
import { LoginPage } from './components/LoginPage';
import { OverviewTab } from './components/OverviewTab';
import { PromptBuilderTab } from './components/PromptBuilderTab';
import { KnowledgeTab } from './components/KnowledgeTab';
import { ToolsTab } from './components/ToolsTab';
import { PlaygroundTab } from './components/PlaygroundTab';
import { ConversationsTab } from './components/ConversationsTab';
import { SettingsTab } from './components/SettingsTab';
import { WidgetConfiguratorTab } from './components/WidgetConfiguratorTab';
import { Button } from './components/ui/Button';

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
          <Button
            variant="secondary"
            style={{ marginTop: '14px' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            🔄 Reload Tab Component
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'prompt' | 'knowledge' | 'tools' | 'playground' | 'embed' | 'conversations' | 'settings'
  >('overview');

  // Auth Session State
  const [session, setSession] = useState<{
    token: string;
    user: { email: string; name: string; role: string };
    tenant: { id: string; name: string; slug: string; apiKey: string };
  } | null>(() => {
    try {
      const saved = localStorage.getItem('kaizech_tenant_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Check URL parameters if passed from admin console with token / tenant
    const urlParams = new URLSearchParams(window.location.search);
    const paramTenant = urlParams.get('tenant');
    const paramKey = urlParams.get('apiKey');

    if (paramTenant && !session) {
      const formattedName = paramTenant
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const newSession = {
        token: 'admin_link_token',
        user: { email: `admin@${paramTenant}.com`, name: `${formattedName} Admin`, role: 'tenant_admin' },
        tenant: {
          id: 't-' + paramTenant,
          name: formattedName,
          slug: paramTenant,
          apiKey: paramKey || `kb_live_sk_${paramTenant}`,
        },
      };
      setSession(newSession);
      localStorage.setItem('kaizech_tenant_session', JSON.stringify(newSession));
    }
  }, []);

  // Configure Axios global headers to lock requests strictly to authenticated tenant
  useEffect(() => {
    if (session?.tenant) {
      axios.defaults.headers.common['x-tenant-slug'] = session.tenant.slug;
      axios.defaults.headers.common['x-api-key'] = session.tenant.apiKey;
    }
  }, [session]);

  const handleLoginSuccess = (newSession: {
    token: string;
    user: { email: string; name: string; role: string };
    tenant: { id: string; name: string; slug: string; apiKey: string };
  }) => {
    setSession(newSession);
    localStorage.setItem('kaizech_tenant_session', JSON.stringify(newSession));
    axios.defaults.headers.common['x-tenant-slug'] = newSession.tenant.slug;
    axios.defaults.headers.common['x-api-key'] = newSession.tenant.apiKey;
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('kaizech_tenant_session');
    delete axios.defaults.headers.common['x-tenant-slug'];
    delete axios.defaults.headers.common['x-api-key'];
  };

  // Render Login Page if unauthenticated
  if (!session) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const { tenant, user } = session;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Brain size={28} /> Kaizech Brain
        </div>

        {/* Locked Active Workspace Badge */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: 'var(--accent-emerald)',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={13} color="var(--accent-emerald)" /> Verified Workspace
          </div>
          <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
            {tenant.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Slug: <code style={{ color: 'var(--accent-cyan)' }}>{tenant.slug}</code>
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
            className={`nav-item ${activeTab === 'embed' ? 'active' : ''}`}
            onClick={() => setActiveTab('embed')}
          >
            <Code2 size={18} /> Embed & SDKs
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

        {/* Account & Logout Section */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <UserCheck size={14} color="var(--accent-emerald)" />
            <span
              style={{
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 600,
              }}
              title={user.email}
            >
              {user.email}
            </span>
          </div>
          <Button
            variant="secondary"
            style={{ width: '100%', fontSize: '12px', padding: '8px 10px', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            <LogOut size={13} color="var(--accent-rose)" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <ErrorBoundary key={`${activeTab}-${tenant.slug}`}>
          {activeTab === 'overview' && <OverviewTab apiKey={tenant.apiKey} />}
          {activeTab === 'prompt' && <PromptBuilderTab apiKey={tenant.apiKey} />}
          {activeTab === 'knowledge' && <KnowledgeTab apiKey={tenant.apiKey} />}
          {activeTab === 'tools' && <ToolsTab apiKey={tenant.apiKey} />}
          {activeTab === 'playground' && <PlaygroundTab apiKey={tenant.apiKey} />}
          {activeTab === 'embed' && (
            <WidgetConfiguratorTab apiKey={tenant.apiKey} tenantName={tenant.name} />
          )}
          {activeTab === 'conversations' && <ConversationsTab apiKey={tenant.apiKey} />}
          {activeTab === 'settings' && <SettingsTab apiKey={tenant.apiKey} />}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
