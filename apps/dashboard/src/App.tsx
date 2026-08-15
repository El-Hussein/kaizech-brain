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
  BrainCircuit,
  Menu,
  X,
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
import { LearningsTab } from './components/LearningsTab';
import { Button } from './components/ui/Button';

interface LearningRule {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

axios.defaults.baseURL =
  (import.meta as any).env?.VITE_API_URL || '';

// Configure Global Axios Interceptors
axios.interceptors.request.use((config) => {
  try {
    const saved = localStorage.getItem('kaizech_tenant_session');
    if (saved) {
      const session = JSON.parse(saved);
      if (session?.tenant) {
        config.headers['x-tenant-slug'] = session.tenant.slug;
        config.headers['x-api-key'] = session.tenant.apiKey;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handler
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.textContent = `Error: ${message}`;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: '#ef4444', // Red-500
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      zIndex: '9999',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
      fontFamily: 'var(--font-sans)',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'opacity 0.3s ease-in-out',
      pointerEvents: 'none',
    });
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
    
    return Promise.reject(error);
  }
);

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
    'overview' | 'prompt' | 'knowledge' | 'tools' | 'playground' | 'embed' | 'conversations' | 'settings' | 'learnings'
  >('overview');

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  // (Headers are now dynamically attached via Axios interceptors above)
  useEffect(() => {
    // Keeping useEffect empty or removing it entirely.
  }, [session]);

  const handleLoginSuccess = (newSession: {
    token: string;
    user: { email: string; name: string; role: string };
    tenant: { id: string; name: string; slug: string; apiKey: string };
  }) => {
    setSession(newSession);
    localStorage.setItem('kaizech_tenant_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('kaizech_tenant_session');
  };

  // Render Login Page if unauthenticated
  if (!session) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const { tenant, user } = session;

  const [pendingLearningsCount, setPendingLearningsCount] = useState(0);

  useEffect(() => {
    if (session) {
      axios.get<LearningRule[]>('/api/v1/learnings').then(res => {
        const count = res.data.filter(l => l.status === 'PENDING').length;
        setPendingLearningsCount(count);
      }).catch(err => console.error('Error fetching learnings count:', err));
    }
  }, [session, activeTab]);

  const handleTabClick = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="sidebar-logo">
          <Brain size={24} color="var(--accent-primary)" /> Kaizech Brain
        </div>
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} color="var(--text-main)" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="sidebar-logo">
            <Brain size={28} color="var(--accent-primary)" /> Kaizech Brain
          </div>
          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} color="var(--text-muted)" />
          </button>
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
            onClick={() => handleTabClick('overview')}
          >
            <LayoutDashboard size={18} /> Overview
          </li>
          <li
            className={`nav-item ${activeTab === 'prompt' ? 'active' : ''}`}
            onClick={() => handleTabClick('prompt')}
          >
            <Sliders size={18} /> Prompt Builder
          </li>
          <li
            className={`nav-item ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => handleTabClick('knowledge')}
          >
            <Database size={18} /> Knowledge (RAG)
          </li>
          <li
            className={`nav-item ${activeTab === 'tools' ? 'active' : ''}`}
            onClick={() => handleTabClick('tools')}
          >
            <Wrench size={18} /> Tools & API Tester
          </li>
          <li
            className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`}
            onClick={() => handleTabClick('playground')}
          >
            <PlayCircle size={18} /> AI Playground
          </li>
          <li
            className={`nav-item ${activeTab === 'embed' ? 'active' : ''}`}
            onClick={() => handleTabClick('embed')}
          >
            <Code2 size={18} /> Embed & SDKs
          </li>
          <li
            className={`nav-item ${activeTab === 'conversations' ? 'active' : ''}`}
            onClick={() => handleTabClick('conversations')}
          >
            <MessageSquare size={18} /> Conversations & Support
          </li>
          <li
            className={`nav-item ${activeTab === 'learnings' ? 'active' : ''}`}
            onClick={() => handleTabClick('learnings')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BrainCircuit size={18} /> AI Memory & Rules
            </div>
            {pendingLearningsCount > 0 && (
              <span style={{
                background: 'var(--accent-rose)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>
                {pendingLearningsCount}
              </span>
            )}
          </li>
          <li
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabClick('settings')}
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
          {activeTab === 'learnings' && <LearningsTab />}
          {activeTab === 'settings' && <SettingsTab apiKey={tenant.apiKey} />}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
