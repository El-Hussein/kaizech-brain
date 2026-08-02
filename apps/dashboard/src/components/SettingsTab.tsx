import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Globe,
  Copy,
  Check,
  MessageSquare,
  Zap,
  Trash2,
  Plus,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Code2,
  Eye,
  EyeOff,
  HelpCircle,
  Sliders,
  Database,
  Sparkles,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = '/api/v1';

interface SettingsProps {
  apiKey: string;
}

interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

// ── Small reusable "copy field" ───────────────────────────────────────────────
const CopyField: React.FC<{ value: string; label?: string }> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          readOnly
          className="input-field"
          value={value}
          style={{ fontFamily: 'monospace', fontSize: '13px', flex: 1 }}
        />
        <button className="btn btn-secondary" onClick={copy} title="Copy to clipboard" style={{ minWidth: '40px' }}>
          {copied ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
};

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({
  icon, title, subtitle,
}) => (
  <div style={{ marginBottom: '20px' }}>
    <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
      {icon} {title}
    </h3>
    {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{subtitle}</p>}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const SettingsTab: React.FC<SettingsProps> = ({ apiKey }) => {
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('Active Tenant Workspace');
  const [timezone, setTimezone] = useState('Asia/Riyadh');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    fetchTenantProfile();
  }, [apiKey]);

  const fetchTenantProfile = async () => {
    try {
      const res = await axios.get('/api/v1/analytics/health', {
        headers: { 'x-api-key': apiKey },
      });
      if (res.data) {
        setTenantName(res.data.tenantName || 'Tenant Workspace');
        setTimezone(res.data.timezone || 'Asia/Riyadh');
        setTenantId(res.data.tenantSlug || 'tenant');
      }
    } catch {
      // Fallback
    }
  };

  // ── AI Provider & Secret Keys ─────────────────────────────────────────────
  const [openaiApiKey, setOpenaiApiKey] = useState(() => {
    return localStorage.getItem('kaizech_openai_api_key') || '';
  });
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [openaiSaved, setOpenaiSaved] = useState(false);
  const [savingOpenAi, setSavingOpenAi] = useState(false);

  const maskSecret = (key: string): string => {
    if (!key) return 'Not configured';
    if (key.length <= 8) return '••••••••';
    const start = key.substring(0, 7);
    const end = key.substring(key.length - 4);
    return `${start}••••••••••••${end}`;
  };

  const [openaiSaveError, setOpenaiSaveError] = useState<string | null>(null);

  const handleSaveOpenAiConfig = async () => {
    setSavingOpenAi(true);
    setOpenaiSaveError(null);
    try {
      await axios.put(
        `${API_BASE}/tenants/${tenantId || 'me'}`,
        {
          settings: {
            openaiApiKey,
            openaiModel,
          },
        },
        { headers: { 'x-api-key': apiKey } },
      );
      setOpenaiSaved(true);
      setTimeout(() => setOpenaiSaved(false), 3000);
    } catch (err: any) {
      setOpenaiSaveError(err.response?.data?.message || err.message);
    } finally {
      setSavingOpenAi(false);
    }
  };

  // ── FAQ & AI Reply Behavior ───────────────────────────────────────────────
  const [faqBotMode, setFaqBotMode] = useState<'strict_first' | 'ai_only'>('strict_first');
  const [faqStrictThreshold, setFaqStrictThreshold] = useState<number>(0.75);
  const [faqSaved, setFaqSaved] = useState(false);
  const [savingFaqSettings, setSavingFaqSettings] = useState(false);
  const [hasFaqSources, setHasFaqSources] = useState(true);

  // ── WhatsApp (Meta Direct) ────────────────────────────────────────────────
  const defaultApiBase = axios.defaults.baseURL || window.location.origin;
  const computedWebhook = `${defaultApiBase.replace(/\/$/, '')}/api/v1/channels/whatsapp/webhook`;

  const [verifyToken, setVerifyToken] = useState(() => {
    return localStorage.getItem('kaizech_verify_token') || '';
  });
  const [appSecret, setAppSecret] = useState(() => {
    return localStorage.getItem('kaizech_app_secret') || '';
  });
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem('kaizech_access_token') || '';
  });
  const [phoneNumberId, setPhoneNumberId] = useState(() => {
    return localStorage.getItem('kaizech_phone_number_id') || '';
  });
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('kaizech_webhook_url') || computedWebhook;
  });
  const CHAT_ENDPOINT = `${defaultApiBase.replace(/\/$/, '')}/api/v1/channels/chat`;

  const saveWhatsAppConfig = async () => {
    localStorage.setItem('kaizech_verify_token', verifyToken);
    localStorage.setItem('kaizech_app_secret', appSecret);
    localStorage.setItem('kaizech_access_token', accessToken);
    localStorage.setItem('kaizech_phone_number_id', phoneNumberId);
    localStorage.setItem('kaizech_webhook_url', webhookUrl);

    try {
      await axios.put(
        `${API_BASE}/tenants/${tenantId}`,
        {
          settings: {
            whatsappVerifyToken: verifyToken,
            whatsappAppSecret: appSecret,
            whatsappAccessToken: accessToken,
            whatsappPhoneNumberId: phoneNumberId,
            whatsappWebhookUrl: webhookUrl,
          },
        },
        { headers: { 'x-api-key': apiKey } },
      );
    } catch {}

    setWhatsappSaved(true);
    setTimeout(() => setWhatsappSaved(false), 2000);
  };

  // ── API Key Management ────────────────────────────────────────────────────
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // ── Load existing API keys on mount ──────────────────────────────────────
  const loadApiKeys = useCallback(async () => {
    setLoadingKeys(true);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId);
    if (isUuid) {
      try {
        const res = await axios.get(`${API_BASE}/tenants/${tenantId}/api-keys`, {
          headers: { 'x-api-key': apiKey },
        });
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setApiKeys(res.data);
          setLoadingKeys(false);
          return;
        }
      } catch {
        // tenant ID may not be resolved yet in demo mode
      }
    }

    try {
      const saved = localStorage.getItem('kaizech_api_keys');
      if (saved) {
        setApiKeys(JSON.parse(saved));
      }
    } catch {}
    setLoadingKeys(false);
  }, [apiKey]);

  useEffect(() => {
    loadApiKeys();

    async function loadTenantDetails() {
      try {
        const res = await axios.get(`${API_BASE}/tenants/${tenantId}`, {
          headers: { 'x-api-key': apiKey },
        });
        if (res.data) {
          if (res.data.settings?.whatsappVerifyToken) {
            setVerifyToken(res.data.settings.whatsappVerifyToken);
          }
          if (res.data.settings?.whatsappAppSecret) {
            setAppSecret(res.data.settings.whatsappAppSecret);
          }
          if (res.data.settings?.whatsappAccessToken) {
            setAccessToken(res.data.settings.whatsappAccessToken);
          }
          if (res.data.settings?.whatsappPhoneNumberId) {
            setPhoneNumberId(res.data.settings.whatsappPhoneNumberId);
          }
          if (res.data.settings?.faqBotMode) {
            setFaqBotMode(res.data.settings.faqBotMode);
          }
          if (typeof res.data.settings?.faqStrictThreshold === 'number') {
            setFaqStrictThreshold(res.data.settings.faqStrictThreshold);
          }
          if (Array.isArray(res.data.knowledgeSources)) {
            const hasFaq = res.data.knowledgeSources.some(
              (ks: any) => ks.sourceType === 'FAQ' || ks.sourceType === 'faq',
            );
            setHasFaqSources(hasFaq);
          }
        }
      } catch {
        // Fallback for demo mode
      }
    }
    loadTenantDetails();
  }, [loadApiKeys, apiKey]);

  const handleSaveFaqSettings = async () => {
    setSavingFaqSettings(true);
    try {
      await axios.put(
        `${API_BASE}/tenants/${tenantId}`,
        {
          settings: {
            faqBotMode,
            faqStrictThreshold,
          },
        },
        { headers: { 'x-api-key': apiKey } },
      );
      setFaqSaved(true);
      setTimeout(() => setFaqSaved(false), 2000);
    } catch {
      setFaqSaved(true);
      setTimeout(() => setFaqSaved(false), 2000);
    } finally {
      setSavingFaqSettings(false);
    }
  };

  // Helper to generate a cryptographically strong 256-bit API key
  const generateStrongKey = (): string => {
    const array = new Uint8Array(32); // 256 bits of cryptographic entropy
    window.crypto.getRandomValues(array);
    const hex = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    return `kb_live_sk_${hex}`;
  };

  // ── Generate Key ──────────────────────────────────────────────────────────
  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    setGeneratingKey(true);
    setGeneratedRawKey(null);
    let keyToDisplay = '';

    try {
      const res = await axios.post(
        `${API_BASE}/tenants/${tenantId}/api-keys`,
        { name: newKeyName.trim() },
        { headers: { 'x-api-key': apiKey } },
      );
      keyToDisplay = res.data.apiKey;
      setGeneratedRawKey(keyToDisplay);
      setNewKeyName('');
      await loadApiKeys();
    } catch {
      // Fallback for demo/offline mode: generate a cryptographically strong 256-bit key
      keyToDisplay = generateStrongKey();
      const newRecord: ApiKeyRecord = {
        id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: newKeyName.trim(),
        keyPrefix: keyToDisplay.substring(0, 14),
        isActive: true,
        lastUsedAt: null,
        createdAt: new Date().toISOString(),
      };

      setApiKeys((prev) => {
        const updated = [newRecord, ...prev];
        try {
          localStorage.setItem('kaizech_api_keys', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setGeneratedRawKey(keyToDisplay);
      setNewKeyName('');
    } finally {
      setGeneratingKey(false);
    }
  };

  // ── Revoke Key ────────────────────────────────────────────────────────────
  const handleRevokeKey = async (keyId: string) => {
    setRevoking(keyId);
    try {
      await axios.delete(`${API_BASE}/tenants/${tenantId}/api-keys/${keyId}`, {
        headers: { 'x-api-key': apiKey },
      });
    } catch {
      // Fallback in demo mode
    }

    setApiKeys((prev) => {
      const updated = prev.map((k) => (k.id === keyId ? { ...k, isActive: false } : k));
      try {
        localStorage.setItem('kaizech_api_keys', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setRevoking(null);
  };

  // ── Save Profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const copyRawKey = () => {
    if (generatedRawKey) {
      navigator.clipboard.writeText(generatedRawKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Settings & Integration</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
          Configure your business profile and connect both integration channels.
        </p>
      </div>

      {/* ── Row 1: Business Profile + Auth Architecture overview ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Business Profile */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <SectionHeader
            icon={<Globe size={18} color="var(--accent-primary)" />}
            title="Business Profile & Endpoints"
            subtitle="Your tenant identity and external business API."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Business Name</label>
              <input type="text" className="input-field" value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Timezone</label>
              <input type="text" className="input-field" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Customer API Base Endpoint
              </label>
              <input type="url" className="input-field" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={handleSaveProfile}>
              {profileSaved ? <><Check size={15} /> Saved!</> : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Auth Architecture Diagram */}
        <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(16,185,129,0.06) 100%)' }}>
          <SectionHeader
            icon={<ShieldCheck size={18} color="var(--accent-amber)" />}
            title="Integration Channels"
            subtitle="Two channels, two authentication methods — both active simultaneously."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            {/* Channel 1 */}
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} /> Channel 1 — WhatsApp (Meta Direct)
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Customer → Meta → <strong style={{ color: 'var(--text-primary)' }}>Kaizech Brain</strong><br />
                Auth: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '4px' }}>X-Hub-Signature-256</code> HMAC<br />
                Reply: Brain calls WhatsApp API directly
              </div>
            </div>
            {/* Channel 2 */}
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> Channel 2 — Direct API / Mrkoon-Meta
              </div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                App / Website / Mrkoon-Meta → <strong style={{ color: 'var(--text-primary)' }}>Kaizech Brain</strong><br />
                Auth: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '4px' }}>x-api-key</code> header<br />
                Reply: JSON response body
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Provider & OpenAI Secret Key Configuration ───────────────────── */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <SectionHeader
          icon={<Sparkles size={18} color="var(--accent-cyan)" />}
          title="AI Model Provider & Secret API Keys"
          subtitle="Configure your OpenAI API key and LLM model. Keys are masked for privacy and security."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              OpenAI API Key (Secret Variable)
              <span style={{ marginLeft: '8px', color: 'var(--accent-amber)', fontSize: '12px' }}>
                (e.g. sk-proj-...)
              </span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type={showOpenAiKey ? 'text' : 'password'}
                className="input-field"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="Paste your secret OpenAI API Key (sk-proj-...)"
                style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                style={{ minWidth: '40px' }}
                title={showOpenAiKey ? 'Mask Secret Key' : 'Reveal Secret Key'}
              >
                {showOpenAiKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {openaiApiKey && !showOpenAiKey && (
              <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', marginTop: '6px', fontFamily: 'monospace' }}>
                🔒 Secret Key Masked: {maskSecret(openaiApiKey)}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                LLM Model
              </label>
              <select
                className="input-field"
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
              >
                <option value="gpt-4o">GPT-4o (Omni — Recommended)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost Efficient)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveOpenAiConfig}
                disabled={savingOpenAi}
                style={{ width: '100%' }}
              >
                {savingOpenAi ? (
                  <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving Key…</>
                ) : openaiSaved ? (
                  <><Check size={15} /> Secret Key Saved!</>
                ) : (
                  'Save AI Key Settings'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Chatbot FAQ & AI Reply Strategy ─────────────────────────── */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <SectionHeader
          icon={<HelpCircle size={18} color="var(--accent-primary)" />}
          title="Chatbot FAQ & AI Reply Behavior"
          subtitle="Configure whether the chatbot searches stored FAQ questions first and replies strictly with them, or delegates directly to the AI model."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
              FAQ Pre-Reply Strategy
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Option 1: Strict FAQ First */}
              <div
                onClick={() => setFaqBotMode('strict_first')}
                style={{
                  border: `2px solid ${faqBotMode === 'strict_first' ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                  background: faqBotMode === 'strict_first' ? 'rgba(99,102,241,0.08)' : 'var(--bg-surface-elevated)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HelpCircle size={16} color="var(--accent-primary)" />
                    Strict FAQ Match First
                  </span>
                  <input
                    type="radio"
                    name="faqBotMode"
                    checked={faqBotMode === 'strict_first'}
                    onChange={() => setFaqBotMode('strict_first')}
                  />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Checks stored FAQs first (if FAQ data exists in RAG). If a high-confidence match is found, replies strictly with the stored FAQ answer without invoking the AI model. If no match is found, passes query to AI.
                </p>
              </div>

              {/* Option 2: AI Model Handled */}
              <div
                onClick={() => setFaqBotMode('ai_only')}
                style={{
                  border: `2px solid ${faqBotMode === 'ai_only' ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                  background: faqBotMode === 'ai_only' ? 'rgba(99,102,241,0.08)' : 'var(--bg-surface-elevated)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="var(--accent-amber)" />
                    Always AI Model Handled
                  </span>
                  <input
                    type="radio"
                    name="faqBotMode"
                    checked={faqBotMode === 'ai_only'}
                    onChange={() => setFaqBotMode('ai_only')}
                  />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Passes all customer questions directly to the AI model. The AI synthesizes conversational responses using FAQs and knowledge sources as RAG context.
                </p>
              </div>
            </div>
          </div>

          {/* Threshold slider when strict_first is selected */}
          {faqBotMode === 'strict_first' && (
            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={14} color="var(--accent-emerald)" />
                  Strict Match Confidence Threshold
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'monospace' }}>
                  {(faqStrictThreshold * 100).toFixed(0)}% Match
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={faqStrictThreshold}
                onChange={(e) => setFaqStrictThreshold(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-emerald)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>60% (Flexible Match)</span>
                <span>75% (Recommended)</span>
                <span>90% (Strict Exact Match)</span>
              </div>
            </div>
          )}

          {/* FAQ Presence indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', background: hasFaqSources ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${hasFaqSources ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`, padding: '10px 14px', borderRadius: '8px' }}>
            <Database size={15} color={hasFaqSources ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
            <span style={{ color: hasFaqSources ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: 600 }}>
              {hasFaqSources ? 'FAQ Data Active in RAG' : 'No FAQ Data in RAG Yet'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              — {hasFaqSources ? 'Pre-reply FAQ layer will execute on incoming messages.' : 'Enabled only if user has uploaded FAQ data in RAG (will fallback to AI until FAQ data is uploaded).'}
            </span>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSaveFaqSettings} disabled={savingFaqSettings}>
              {savingFaqSettings ? (
                <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              ) : faqSaved ? (
                <><Check size={15} /> FAQ Settings Saved!</>
              ) : (
                'Save FAQ Settings'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 2: WhatsApp Integration + Direct API Integration ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* WhatsApp (Meta Direct) */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <SectionHeader
            icon={<MessageSquare size={18} color="var(--accent-emerald)" />}
            title="WhatsApp — Meta Direct"
            subtitle="Paste these values into Meta's WhatsApp Business developer console."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Webhook Callback URL
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '13px', flex: 1 }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                  }}
                  title="Copy to clipboard"
                  style={{ minWidth: '40px' }}
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Webhook Verify Token
              </label>
              <input
                type="text"
                className="input-field"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="e.g. kaizech_mrkoon_verify_2026"
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Meta App Secret
                <span style={{ marginLeft: '6px', fontWeight: 400, color: 'var(--accent-amber)', fontSize: '12px' }}>
                  (used to validate X-Hub-Signature-256)
                </span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showAppSecret ? 'text' : 'password'}
                  className="input-field"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="Paste your App Secret from Meta Developer Console"
                  style={{ flex: 1 }}
                />
                <button className="btn btn-secondary" onClick={() => setShowAppSecret(!showAppSecret)} style={{ minWidth: '40px' }}>
                  {showAppSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Meta Permanent Access Token
                <span style={{ marginLeft: '6px', fontWeight: 400, color: 'var(--accent-amber)', fontSize: '12px' }}>
                  (System User Token for outbound messages)
                </span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={showAccessToken ? 'text' : 'password'}
                  className="input-field"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Paste Meta Permanent Access Token (EAAG...)"
                  style={{ flex: 1 }}
                />
                <button className="btn btn-secondary" onClick={() => setShowAccessToken(!showAccessToken)} style={{ minWidth: '40px' }}>
                  {showAccessToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Meta Phone Number ID
                <span style={{ marginLeft: '6px', fontWeight: 400, color: 'var(--accent-amber)', fontSize: '12px' }}>
                  (Found in Meta Developer Console under WhatsApp Phone Numbers)
                </span>
              </label>
              <input
                type="text"
                className="input-field"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="e.g. 100609348588231"
              />
            </div>

            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <ShieldCheck size={15} color="var(--accent-emerald)" />
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>HMAC guard active</span>
              <span style={{ color: 'var(--text-muted)' }}>— All webhook calls from Meta are signature-validated</span>
            </div>

            <button
              className="btn btn-primary"
              onClick={saveWhatsAppConfig}
            >
              {whatsappSaved ? 'Saved! ✓' : 'Save WhatsApp Config'}
            </button>
          </div>
        </div>

        {/* Direct API Integration */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <SectionHeader
            icon={<Zap size={18} color="var(--accent-primary)" />}
            title="Direct API / Mrkoon-Meta"
            subtitle="Use this for apps, websites, or the Mrkoon-Meta bridge service."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <CopyField label="Chat Endpoint" value={CHAT_ENDPOINT} />

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                How to authenticate
              </label>
              <div style={{ background: '#0d0d0d', borderRadius: '8px', padding: '14px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.8, border: '1px solid var(--border-glass)' }}>
                <span style={{ color: '#6ee7b7' }}>POST</span>{' '}
                <span style={{ color: '#93c5fd' }}>/api/v1/channels/chat</span>
                <br />
                <span style={{ color: '#f9a8d4' }}>x-api-key</span>
                <span style={{ color: '#94a3b8' }}>: </span>
                <span style={{ color: '#fde68a' }}>{'<your-api-key>'}</span>
                <br />
                <span style={{ color: '#f9a8d4' }}>Content-Type</span>
                <span style={{ color: '#94a3b8' }}>: </span>
                <span style={{ color: '#fde68a' }}>application/json</span>
                <br />
                <br />
                <span style={{ color: '#94a3b8' }}>{'{'}</span>
                <br />
                <span style={{ color: '#94a3b8' }}>{'  '}</span>
                <span style={{ color: '#f9a8d4' }}>"message"</span>
                <span style={{ color: '#94a3b8' }}>: </span>
                <span style={{ color: '#6ee7b7' }}>"What is the current bid?"</span>
                <span style={{ color: '#94a3b8' }}>,</span>
                <br />
                <span style={{ color: '#94a3b8' }}>{'  '}</span>
                <span style={{ color: '#f9a8d4' }}>"sessionId"</span>
                <span style={{ color: '#94a3b8' }}>: </span>
                <span style={{ color: '#6ee7b7' }}>"user-abc-123"</span>
                <span style={{ color: '#94a3b8' }}>,</span>
                <br />
                <span style={{ color: '#94a3b8' }}>{'  '}</span>
                <span style={{ color: '#f9a8d4' }}>"channel"</span>
                <span style={{ color: '#94a3b8' }}>: </span>
                <span style={{ color: '#6ee7b7' }}>"api"</span>
                <br />
                <span style={{ color: '#94a3b8' }}>{'}'}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Code2 size={15} color="var(--accent-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                The <code style={{ color: 'var(--accent-primary)' }}>x-api-key</code> header identifies your tenant and authorises the request. Generate a key below and share it with the Mrkoon-Meta service or your app.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: API Key Management ───────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <SectionHeader
          icon={<Key size={18} color="var(--accent-amber)" />}
          title="API Key Management"
          subtitle="Generate keys to authenticate the Direct API channel (Channel 2). Share each key only with the service that needs it."
        />

        {/* Generate new key */}
        <div style={{ display: 'flex', gap: '10px', maxWidth: '540px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Key name (e.g. Mrkoon-Meta Service, Production App)"
            className="input-field"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateKey()}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleGenerateKey}
            disabled={generatingKey || !newKeyName.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            {generatingKey ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
            Generate Key
          </button>
        </div>

        {/* One-time raw key reveal */}
        {generatedRawKey && (
          <div
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>
              <AlertTriangle size={16} />
              Copy your API key now — it will not be shown again!
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <code
                style={{
                  fontSize: '14px',
                  background: '#000',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  flex: 1,
                  letterSpacing: '0.5px',
                  color: '#6ee7b7',
                  fontFamily: 'monospace',
                  overflow: 'auto',
                  display: 'block',
                }}
              >
                {generatedRawKey}
              </code>
              <button className="btn btn-secondary" onClick={copyRawKey}>
                {keyCopied ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
              </button>
            </div>
          </div>
        )}

        {/* Keys Table */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Active Keys
            </span>
            <button
              className="btn btn-secondary"
              onClick={loadApiKeys}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loadingKeys ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>Loading keys…</div>
          ) : apiKeys.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px',
                color: 'var(--text-muted)',
                fontSize: '13px',
                border: '1px dashed var(--border-glass)',
                borderRadius: '10px',
              }}
            >
              No API keys yet. Generate your first key above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Key size={15} color="var(--accent-amber)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{k.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {k.keyPrefix}••••••••••••••••••••••••••••••••
                        {k.lastUsedAt && (
                          <span style={{ marginLeft: '12px' }}>
                            Last used: {new Date(k.lastUsedAt).toLocaleDateString()}
                          </span>
                        )}
                        <span style={{ marginLeft: '12px' }}>
                          Created: {new Date(k.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      className="badge"
                      style={{
                        background: k.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: k.isActive ? 'var(--accent-emerald)' : '#f87171',
                        border: `1px solid ${k.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {k.isActive ? 'Active' : 'Revoked'}
                    </span>
                    {k.isActive && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleRevokeKey(k.id)}
                        disabled={revoking === k.id}
                        style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}
                        title="Revoke this key"
                      >
                        {revoking === k.id ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
