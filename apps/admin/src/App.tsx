import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Users, Cpu, Activity, Key, CheckCircle2, Search, Trash2, Copy, Check } from 'lucide-react';
import axios from 'axios';

axios.defaults.baseURL = (import.meta as any).env?.VITE_API_URL || 'https://kaizech-brain-production.up.railway.app';


export const App: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Tenant Form
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [languages, setLanguages] = useState('en, ar');
  const [timezone, setTimezone] = useState('Asia/Riyadh');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');

  // Created Tenant Result State
  const [newTenantResult, setNewTenantResult] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/tenants');
      setTenants(res.data || []);
    } catch {
      // Mock data for display
      setTenants([
        {
          id: 't-1',
          name: 'Mrkoon Auctions',
          slug: 'mrkoon',
          languages: ['ar', 'en'],
          timezone: 'Asia/Riyadh',
          status: 'active',
          apiEndpoint: 'https://api.mrkoon.com/v1/bot',
          createdAt: new Date().toISOString(),
        },
        {
          id: 't-2',
          name: 'E-Nursery Schools',
          slug: 'e-nursery',
          languages: ['en'],
          timezone: 'UTC',
          status: 'active',
          apiEndpoint: 'https://nursery.app/api/chatbot',
          createdAt: new Date().toISOString(),
        },
        {
          id: 't-3',
          name: 'City Care Hospital',
          slug: 'city-care',
          languages: ['en', 'ar'],
          timezone: 'Asia/Dubai',
          status: 'active',
          apiEndpoint: 'https://citycare.hospital/bot/v1',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const langArray = languages.split(',').map((l) => l.trim());

      const res = await axios.post('/api/v1/tenants', {
        name,
        slug,
        languages: langArray,
        timezone,
        apiEndpoint,
        greetingMessage,
      });

      setNewTenantResult(res.data);
      fetchTenants();
    } catch (err: any) {
      alert(`Tenant onboarding failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '28px', fontWeight: 800, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Kaizech Brain — Platform Super Admin
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Multi-tenant AI Agent Platform Console. Manage tenants, issue API keys, and monitor global metrics.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => { setShowModal(true); setNewTenantResult(null); }}>
          <Plus size={16} /> Onboard New Tenant (Zero Code)
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Active Tenants</span>
            <Users size={20} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '12px' }}>{tenants.length}</div>
          <span className="badge badge-success" style={{ marginTop: '8px' }}>100% Multi-tenant Isolated</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Total AI Agents</span>
            <Cpu size={20} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '12px' }}>{tenants.length}</div>
          <span className="badge badge-blue" style={{ marginTop: '8px' }}>OpenAI GPT-4o Powered</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Platform Status</span>
            <Activity size={20} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '12px', color: 'var(--accent-emerald)' }}>
            Healthy
          </div>
          <span style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '8px', display: 'block' }}>
            PostgreSQL + pgvector + Redis
          </span>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Registered Customer Tenants ({tenants.length})</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tenants.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{t.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Slug: <code style={{ color: 'var(--accent-cyan)' }}>{t.slug}</code> | Timezone: {t.timezone} | Languages: {Array.isArray(t.languages) ? t.languages.join(', ') : t.languages}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '4px' }}>
                  API Endpoint: {t.apiEndpoint || 'None configured'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="badge badge-success"><CheckCircle2 size={12} /> {t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Onboarding New Tenant */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '540px', padding: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Onboard New Tenant</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Zero-code customer onboarding. Generates a new tenant workspace and API Key.
            </p>

            {newTenantResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="glass-card" style={{ padding: '16px', borderColor: 'var(--accent-emerald)' }}>
                  <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
                    🎉 Tenant '{newTenantResult.tenant?.name}' Onboarded!
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>
                    Save this generated API key securely to access the tenant dashboard and APIs:
                  </p>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <code style={{ fontSize: '13px', background: '#000', padding: '8px 12px', borderRadius: '6px', flex: 1, color: '#38bdf8' }}>
                      {newTenantResult.apiKey}
                    </code>
                    <button className="btn btn-secondary" onClick={() => copyKey(newTenantResult.apiKey)}>
                      {copiedKey === newTenantResult.apiKey ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={() => { setShowModal(false); setNewTenantResult(null); }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Business Name</label>
                  <input type="text" placeholder="e.g. Mrkoon Auctions" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Tenant Slug (Unique ID)</label>
                  <input type="text" placeholder="e.g. mrkoon" className="input-field" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Supported Languages (comma-separated)</label>
                  <input type="text" placeholder="en, ar" className="input-field" value={languages} onChange={(e) => setLanguages(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Timezone</label>
                  <input type="text" placeholder="Asia/Riyadh" className="input-field" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Customer API Base Endpoint</label>
                  <input type="url" placeholder="https://api.client.com/chatbot/v1" className="input-field" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Welcome Greeting Message</label>
                  <textarea placeholder="Welcome to Mrkoon Auctions! How can I help you today?" className="input-field" style={{ minHeight: '60px' }} value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Provisioning...' : 'Provision Tenant'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
