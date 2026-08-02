import React, { useState } from 'react';
import { Brain, Lock, Mail, Building2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/Button';

interface LoginPageProps {
  onLoginSuccess: (session: {
    token: string;
    user: { email: string; name: string; role: string };
    tenant: { id: string; name: string; slug: string; apiKey: string };
  }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      setLoading(true);

      const res = await axios.post('/api/v1/auth/login', {
        email: email.trim(),
        slug: workspaceSlug.trim().toLowerCase(),
        password: password.trim(),
      });

      if (res.data && res.data.tenant) {
        onLoginSuccess({
          token: res.data.accessToken,
          user: res.data.user,
          tenant: res.data.tenant,
        });
      } else {
        setErrorMessage('Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      // Display strict API authentication failure error
      const msg =
        err.response?.data?.message ||
        'Invalid account email, workspace ID, or password.';
      setErrorMessage(typeof msg === 'string' ? msg : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at 50% 30%, #0f172a 0%, #07090e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--gradient-brand)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)',
            }}
          >
            <Brain size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Kaizech Brain
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
            AI Agent Management & Integration Portal
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: '10px',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Clean Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Account Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '38px' }}
              />
              <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Workspace ID / Slug (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. your-company-slug"
                value={workspaceSlug}
                onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().trim())}
                style={{ paddingLeft: '38px' }}
              />
              <Building2 size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '38px' }}
              />
              <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            loadingText="Authenticating..."
            style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: '8px', fontSize: '15px' }}
          >
            Sign In to Workspace <ArrowRight size={16} />
          </Button>
        </form>

        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)' }}>
          <ShieldCheck size={14} color="var(--accent-emerald)" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          Encrypted Multi-Tenant Isolation
        </div>
      </div>
    </div>
  );
};
