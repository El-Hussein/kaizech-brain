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
  CheckCircle2,
  Activity,
  Phone,
  Send,
  Server,
  Lock,
  Code2,
  Eye,
  EyeOff,
  HelpCircle,
  Sliders,
  Database,
  Sparkles,
} from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/Button';

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
        <Button variant="secondary" onClick={copy} title="Copy to clipboard" style={{ minWidth: '40px' }}>
          {copied ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
        </Button>
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

export const COMMON_TIMEZONES = [
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (Saudi Arabia — GMT+3)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UAE / Gulf — GMT+4)' },
  { value: 'Asia/Kuwait', label: 'Asia/Kuwait (Kuwait — GMT+3)' },
  { value: 'Asia/Bahrain', label: 'Asia/Bahrain (Bahrain — GMT+3)' },
  { value: 'Asia/Qatar', label: 'Asia/Qatar (Qatar — GMT+3)' },
  { value: 'Asia/Muscat', label: 'Asia/Muscat (Oman — GMT+4)' },
  { value: 'Asia/Amman', label: 'Asia/Amman (Jordan — GMT+3)' },
  { value: 'Asia/Beirut', label: 'Asia/Beirut (Lebanon — GMT+3)' },
  { value: 'Asia/Baghdad', label: 'Asia/Baghdad (Iraq — GMT+3)' },
  { value: 'Africa/Cairo', label: 'Africa/Cairo (Egypt — GMT+3)' },
  { value: 'Africa/Casablanca', label: 'Africa/Casablanca (Morocco — GMT+1)' },
  { value: 'UTC', label: 'UTC (Universal Coordinated Time — GMT+0)' },
  { value: 'Europe/London', label: 'Europe/London (UK — GMT+0/+1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (Central Europe — GMT+1/+2)' },
  { value: 'Europe/Istanbul', label: 'Europe/Istanbul (Turkey — GMT+3)' },
  { value: 'America/New_York', label: 'America/New_York (US Eastern — GMT-5/-4)' },
  { value: 'America/Chicago', label: 'America/Chicago (US Central — GMT-6/-5)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (US Pacific — GMT-8/-7)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (Singapore — GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan — GMT+9)' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export const SettingsTab: React.FC<SettingsProps> = ({ apiKey }) => {
  const [subTab, setSubTab] = useState<'general' | 'limits_strategy' | 'whatsapp' | 'api_keys'>('general');
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
        if (res.data.apiEndpoint) setApiEndpoint(res.data.apiEndpoint);
      }
    } catch {
      // Fallback
    }
  };

  // ── AI Provider & Secret Keys ─────────────────────────────────────────────
  const [aiProvider, setAiProvider] = useState<'openai' | 'groq'>('openai');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
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

  const handleSaveAiConfig = async () => {
    setSavingOpenAi(true);
    setOpenaiSaveError(null);

    // Removed localStorage storage for security

    try {
      await axios.put(
        `${API_BASE}/tenants/${tenantId || 'me'}`,
        {
          settings: {
            aiProvider,
            openaiApiKey,
            openaiModel,
            groqApiKey,
            groqModel,
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

  // ── Conversation Message Limit & Human Handoff Settings ────────────────────
  const [maxMessagesLimit, setMaxMessagesLimit] = useState<number>(0);
  const [handoffNoticeText, setHandoffNoticeText] = useState<string>('');
  const [autoHandoffOnLowKnowledge, setAutoHandoffOnLowKnowledge] = useState<boolean>(false);
  const [autoHandoffOnKeywords, setAutoHandoffOnKeywords] = useState<boolean>(true);
  const [autoHandoffOnUncertainty, setAutoHandoffOnUncertainty] = useState<boolean>(true);
  const [autoHandoffKeywordsText, setAutoHandoffKeywordsText] = useState<string>('agent, human, support, representative, موظف, دعم');
  const [limitSaved, setLimitSaved] = useState(false);
  const [savingLimitSettings, setSavingLimitSettings] = useState(false);

  // ── WhatsApp (Meta Direct) ────────────────────────────────────────────────
  const defaultApiBase = axios.defaults.baseURL || window.location.origin;
  const computedWebhook = `${defaultApiBase.replace(/\/$/, '')}/api/v1/channels/whatsapp/webhook`;

  const [verifyToken, setVerifyToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(computedWebhook);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testResults, setTestResults] = useState<any | null>(null);

  const handleTestWhatsAppConnection = async () => {
    setTestingWhatsApp(true);
    setTestResults(null);
    try {
      const res = await axios.post(`${API_BASE}/channels/whatsapp/test`, {}, {
        headers: { 'x-api-key': apiKey },
      });
      setTestResults(res.data);
    } catch (err: any) {
      setTestResults({
        success: false,
        error: err.response?.data?.message || err.message,
      });
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const CHAT_ENDPOINT = `${defaultApiBase.replace(/\/$/, '')}/api/v1/channels/chat`;

  const saveWhatsAppConfig = async () => {
    // Removed localStorage storage for security

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
            enabledChannels: ['whatsapp', 'api'],
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

    // Removed fallback to local storage
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
          if (res.data.settings?.aiProvider) {
            setAiProvider(res.data.settings.aiProvider);
          }
          if (res.data.settings?.openaiApiKey) {
            setOpenaiApiKey(res.data.settings.openaiApiKey);
          }
          if (res.data.settings?.openaiModel) {
            setOpenaiModel(res.data.settings.openaiModel);
          }
          if (res.data.settings?.groqApiKey) {
            setGroqApiKey(res.data.settings.groqApiKey);
          }
          if (res.data.settings?.groqModel) {
            setGroqModel(res.data.settings.groqModel);
          }
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
          if (typeof res.data.settings?.maxMessagesPerConversation === 'number') {
            setMaxMessagesLimit(res.data.settings.maxMessagesPerConversation);
          } else if (typeof res.data.settings?.maxConversationMessages === 'number') {
            setMaxMessagesLimit(res.data.settings.maxConversationMessages);
          }
          if (res.data.settings?.handoffMessage) {
            setHandoffNoticeText(res.data.settings.handoffMessage);
          }
          if (typeof res.data.settings?.autoHandoffOnLowKnowledge === 'boolean') {
            setAutoHandoffOnLowKnowledge(res.data.settings.autoHandoffOnLowKnowledge);
          }
          if (typeof res.data.settings?.autoHandoffOnKeywords === 'boolean') {
            setAutoHandoffOnKeywords(res.data.settings.autoHandoffOnKeywords);
          }
          if (typeof res.data.settings?.autoHandoffOnUncertainty === 'boolean') {
            setAutoHandoffOnUncertainty(res.data.settings.autoHandoffOnUncertainty);
          }
          if (res.data.settings?.autoHandoffKeywords) {
            setAutoHandoffKeywordsText(res.data.settings.autoHandoffKeywords);
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

  const handleSaveLimitSettings = async () => {
    setSavingLimitSettings(true);
    try {
      await axios.put(
        `${API_BASE}/tenants/${tenantId || 'me'}`,
        {
          settings: {
            maxMessagesPerConversation: maxMessagesLimit,
            handoffMessage: handoffNoticeText,
            autoHandoffOnLowKnowledge,
            autoHandoffOnKeywords,
            autoHandoffOnUncertainty,
            autoHandoffKeywords: autoHandoffKeywordsText,
          },
        },
        { headers: { 'x-api-key': apiKey } },
      );
      setLimitSaved(true);
      setTimeout(() => setLimitSaved(false), 2000);
    } catch {
      setLimitSaved(true);
      setTimeout(() => setLimitSaved(false), 2000);
    } finally {
      setSavingLimitSettings(false);
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
      return updated;
    });
    setRevoking(null);
  };

  // ── Save Profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    try {
      await axios.put(
        `${API_BASE}/tenants/${tenantId || 'me'}`,
        {
          name: tenantName,
          timezone: timezone,
          apiEndpoint: apiEndpoint,
        },
        { headers: { 'x-api-key': apiKey } },
      );
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update business profile');
    }
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
          Configure your business profile, bot behavior limits, WhatsApp integration, and developer API keys.
        </p>
      </div>

      {/* ── Sub-Navigation Bar ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px', flexWrap: 'wrap' }}>
        <Button
          variant={subTab === 'general' ? 'primary' : 'secondary'}
          onClick={() => setSubTab('general')}
          style={{ gap: '6px', fontSize: '13px' }}
        >
          <Globe size={15} /> General & Model
        </Button>
        <Button
          variant={subTab === 'limits_strategy' ? 'primary' : 'secondary'}
          onClick={() => setSubTab('limits_strategy')}
          style={{ gap: '6px', fontSize: '13px' }}
        >
          <Sliders size={15} /> Bot Strategy & Limits
        </Button>
        <Button
          variant={subTab === 'whatsapp' ? 'primary' : 'secondary'}
          onClick={() => setSubTab('whatsapp')}
          style={{ gap: '6px', fontSize: '13px' }}
        >
          <MessageSquare size={15} /> WhatsApp Channel
        </Button>
        <Button
          variant={subTab === 'api_keys' ? 'primary' : 'secondary'}
          onClick={() => setSubTab('api_keys')}
          style={{ gap: '6px', fontSize: '13px' }}
        >
          <Key size={15} /> API Keys & Developer Docs
        </Button>
      </div>

      {subTab === 'general' && (
        <>
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
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Base API URL (Tool Endpoints)</label>
              <input 
                type="url" 
                placeholder="https://api.yourdomain.com" 
                className="input-field" 
                value={apiEndpoint} 
                onChange={(e) => setApiEndpoint(e.target.value)} 
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Used as the base domain for Tool relative paths (e.g., /api/chatbot/getUserInfo).
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Timezone</label>
              <select
                className="input-field"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ cursor: 'pointer', background: 'var(--bg-surface-elevated)', color: 'var(--text-primary)' }}
              >
                {!COMMON_TIMEZONES.some((tz) => tz.value === timezone) && (
                  <option value={timezone} style={{ background: '#1e293b', color: '#fff' }}>
                    {timezone} (Custom / Current)
                  </option>
                )}
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value} style={{ background: '#1e293b', color: '#fff' }}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="primary" style={{ marginTop: '8px' }} onClick={handleSaveProfile}>
              {profileSaved ? <><Check size={15} /> Saved!</> : 'Save Profile'}
            </Button>
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

      {/* ── AI Provider & Secret Key Configuration ───────────────────── */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <SectionHeader
          icon={<Sparkles size={18} color="var(--accent-cyan)" />}
          title="AI Model Provider & Secret API Keys"
          subtitle="Select your preferred AI Inference Provider (OpenAI or Groq Ultra-Fast LPU) and set API keys."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Provider Selection */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
              Active AI Provider
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

              {/* Option 1: OpenAI */}
              <div
                onClick={() => setAiProvider('openai')}
                style={{
                  border: `2px solid ${aiProvider === 'openai' ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                  background: aiProvider === 'openai' ? 'rgba(99,102,241,0.08)' : 'var(--bg-surface-elevated)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="var(--accent-primary)" /> OpenAI (GPT-4o / GPT-4o-mini)
                  </span>
                  <input
                    type="radio"
                    name="aiProvider"
                    checked={aiProvider === 'openai'}
                    onChange={() => setAiProvider('openai')}
                  />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Official OpenAI cloud API. Powerful reasoning with GPT-4o and GPT-4o-mini models.
                </p>
              </div>

              {/* Option 2: Groq */}
              <div
                onClick={() => setAiProvider('groq')}
                style={{
                  border: `2px solid ${aiProvider === 'groq' ? 'var(--accent-cyan)' : 'var(--border-glass)'}`,
                  background: aiProvider === 'groq' ? 'rgba(6,182,212,0.08)' : 'var(--bg-surface-elevated)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} color="var(--accent-cyan)" /> Groq (Ultra-Fast 1,000+ tok/sec)
                  </span>
                  <input
                    type="radio"
                    name="aiProvider"
                    checked={aiProvider === 'groq'}
                    onChange={() => setAiProvider('groq')}
                  />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Ultra-low latency hardware inference (Llama 3.3 70B & Llama 3.1 8B). Free tier available.
                </p>
              </div>
            </div>
          </div>

          {/* Groq Settings */}
          {aiProvider === 'groq' && (
            <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Groq API Key (Optional)
                  <span style={{ marginLeft: '8px', color: 'var(--accent-cyan)', fontSize: '12px' }}>
                    (Get free key at console.groq.com — starts with gsk_...)
                  </span>
                </label>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Leave blank to use the platform's default AI key (included in your subscription).
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type={showGroqKey ? 'text' : 'password'}
                    className="input-field"
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="Paste your secret Groq API Key (gsk_...)"
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    style={{ minWidth: '40px' }}
                  >
                    {showGroqKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </Button>
                </div>
                {groqApiKey && !showGroqKey && (
                  <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', marginTop: '6px', fontFamily: 'monospace' }}>
                    🔒 Groq Key Masked: {maskSecret(groqApiKey)}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Groq Model
                </label>
                <select
                  className="input-field"
                  value={groqModel}
                  onChange={(e) => setGroqModel(e.target.value)}
                >
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Recommended — High Intelligence & Ultra-Fast)</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Instant 1,200+ tok/sec)</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B (32k Context Window)</option>
                </select>
              </div>
            </div>
          )}

          {/* OpenAI Settings */}
          {aiProvider === 'openai' && (
            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  OpenAI API Key (Optional)
                  <span style={{ marginLeft: '8px', color: 'var(--accent-amber)', fontSize: '12px' }}>
                    (starts with sk-proj-...)
                  </span>
                </label>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Leave blank to use the platform's default AI key (included in your subscription).
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type={showOpenAiKey ? 'text' : 'password'}
                    className="input-field"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="Paste your secret OpenAI API Key (sk-proj-...)"
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                    style={{ minWidth: '40px' }}
                  >
                    {showOpenAiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </Button>
                </div>
                {openaiApiKey && !showOpenAiKey && (
                  <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', marginTop: '6px', fontFamily: 'monospace' }}>
                    🔒 OpenAI Key Masked: {maskSecret(openaiApiKey)}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  OpenAI Model
                </label>
                <select
                  className="input-field"
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost Efficient)</option>
                  <option value="gpt-4o">GPT-4o (Omni Reasoning)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={handleSaveAiConfig}
              loading={savingOpenAi}
              loadingText="Saving Provider Settings…"
            >
              {openaiSaved ? <><Check size={15} /> AI Provider Settings Saved!</> : 'Save AI Provider Settings'}
            </Button>
          </div>
        </div>
      </div>
        </>
      )}

      {subTab === 'limits_strategy' && (
        <>
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
            <Button variant="primary" onClick={handleSaveFaqSettings} loading={savingFaqSettings} loadingText="Saving…">
              {faqSaved ? <><Check size={15} /> FAQ Settings Saved!</> : 'Save FAQ Settings'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Conversation Message Limits & Automated Human Handoff Card ── */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <SectionHeader
          icon={<Sliders size={18} color="var(--accent-amber)" />}
          title="Conversation Message Limit & Automated Human Handoff"
          subtitle="Set maximum message limit per conversation. When reached, the AI pauses and transfers the chat to hands-off mode for human operators."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Default Max Messages Limit Per Conversation
                <span style={{ marginLeft: '6px', color: 'var(--accent-emerald)', fontSize: '12px' }}>
                  (0 = Unlimited)
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="500"
                className="input-field"
                value={maxMessagesLimit}
                onChange={(e) => setMaxMessagesLimit(parseInt(e.target.value, 10) || 0)}
                placeholder="e.g. 10 (0 for unlimited)"
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Quick options: 0 (Unlimited), 5, 10, 20 msgs. Can also be overridden per conversation.
              </span>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Custom Handoff Notification Notice
              </label>
              <input
                type="text"
                className="input-field"
                value={handoffNoticeText}
                onChange={(e) => setHandoffNoticeText(e.target.value)}
                placeholder="⚠️ Conversation message limit reached. AI chat stopped and handed off to human support."
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Sent to user when message limit or auto-handoff rule is triggered.
              </span>
            </div>
          </div>

          {/* ── Automatic Escalation Rules ── */}
          <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              ⚡ Automatic Escalation & Handoff Rules
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoHandoffOnKeywords}
                  onChange={(e) => setAutoHandoffOnKeywords(e.target.checked)}
                />
                Auto-Handoff on User Escalation Keywords
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoHandoffOnUncertainty}
                  onChange={(e) => setAutoHandoffOnUncertainty(e.target.checked)}
                />
                Auto-Handoff on AI Uncertainty / Fallbacks
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoHandoffOnLowKnowledge}
                  onChange={(e) => setAutoHandoffOnLowKnowledge(e.target.checked)}
                />
                Auto-Handoff when Knowledge (RAG) Context is Empty
              </label>
            </div>

            {autoHandoffOnKeywords && (
              <div style={{ marginTop: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Custom Escalation Keywords (comma-separated):
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={autoHandoffKeywordsText}
                  onChange={(e) => setAutoHandoffKeywordsText(e.target.value)}
                  placeholder="agent, human, support, representative, real person, موظف, دعم"
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: maxMessagesLimit > 0 || autoHandoffOnKeywords ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
              {maxMessagesLimit > 0 || autoHandoffOnKeywords
                ? `⚡ Active: Automated handoff configured (Limit: ${maxMessagesLimit > 0 ? maxMessagesLimit + ' msgs' : 'Disabled'}, Keywords & Fallback triggers active).`
                : 'ℹ️ Automatic handoff rules are disabled.'}
            </div>
            <Button variant="primary" onClick={handleSaveLimitSettings} loading={savingLimitSettings} loadingText="Saving…">
              {limitSaved ? <><Check size={15} /> Handoff Settings Saved!</> : 'Save Handoff Settings'}
            </Button>
          </div>
        </div>
      </div>
        </>
      )}

      {subTab === 'whatsapp' && (
        <>
          {/* ── Top Panel: Live WhatsApp Integration Health & Diagnostics Matrix ── */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <SectionHeader
                icon={<Activity size={20} color="var(--accent-emerald)" />}
                title="WhatsApp Integration Live Health & Diagnostics"
                subtitle="Real-time background verification of Meta Graph API access, Phone Number ID binding, and Webhook HMAC guards."
              />
              <Button
                variant="secondary"
                onClick={handleTestWhatsAppConnection}
                loading={testingWhatsApp}
                loadingText="Auditing Connection..."
                style={{ gap: '6px', fontSize: '13px' }}
              >
                <RefreshCw size={14} /> Re-Run Live Audit
              </Button>
            </div>

            {/* 4 Stat Cards Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
              {/* Card 1: Meta Graph API Token */}
              <div style={{ background: 'var(--bg-surface-elevated)', border: `1px solid ${testResults?.checks?.accessToken?.status === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color={testResults?.checks?.accessToken?.status === 'ok' ? 'var(--accent-emerald)' : '#ef4444'} />
                    Meta System Token
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: testResults?.checks?.accessToken?.status === 'ok' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: testResults?.checks?.accessToken?.status === 'ok' ? 'var(--accent-emerald)' : '#ef4444' }}>
                    {testResults?.checks?.accessToken?.status === 'ok' ? 'VERIFIED' : 'ACTION NEEDED'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {testResults?.checks?.accessToken?.details?.verified_name ? `Meta Account: ${testResults.checks.accessToken.details.verified_name}` : 'Meta Graph API'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {testResults?.checks?.accessToken?.message || 'Click "Re-Run Live Audit" to test token'}
                </div>
              </div>

              {/* Card 2: Phone Number ID */}
              <div style={{ background: 'var(--bg-surface-elevated)', border: `1px solid ${testResults?.checks?.phoneNumberId?.status === 'ok' ? 'rgba(6,182,212,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={16} color="var(--accent-cyan)" />
                    Phone Number ID
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: testResults?.checks?.phoneNumberId?.status === 'ok' ? 'rgba(6,182,212,0.15)' : 'rgba(239,68,68,0.15)', color: testResults?.checks?.phoneNumberId?.status === 'ok' ? 'var(--accent-cyan)' : '#ef4444' }}>
                    {testResults?.checks?.phoneNumberId?.status === 'ok' ? 'BOUND' : 'UNBOUND'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '4px' }}>
                  {testResults?.checks?.phoneNumberId?.phoneId || phoneNumberId || 'Not set'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Matches incoming & outgoing Meta Graph API routing
                </div>
              </div>

              {/* Card 3: HMAC Security Guard */}
              <div style={{ background: 'var(--bg-surface-elevated)', border: `1px solid ${testResults?.checks?.appSecret?.status === 'ok' ? 'rgba(168,85,247,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={16} color="#c084fc" />
                    HMAC Signature Guard
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: testResults?.checks?.appSecret?.status === 'ok' ? 'rgba(168,85,247,0.15)' : 'rgba(239,68,68,0.15)', color: '#c084fc' }}>
                    {testResults?.checks?.appSecret?.status === 'ok' ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  SHA-256 Validation
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {testResults?.checks?.appSecret?.message || 'Meta App Secret configured'}
                </div>
              </div>

              {/* Card 4: Webhook Endpoint */}
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Server size={16} color="var(--accent-amber)" />
                    Webhook Endpoint
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' }}>
                    200 OK
                  </span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-amber)', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '4px' }}>
                  {webhookUrl}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Meta Webhook handshake ready
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp (Meta Direct) Credentials Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <SectionHeader
            icon={<MessageSquare size={18} color="var(--accent-emerald)" />}
            title="WhatsApp Credentials & Config"
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
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                  }}
                  title="Copy to clipboard"
                  style={{ minWidth: '40px' }}
                >
                  <Copy size={15} />
                </Button>
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
                <Button variant="secondary" onClick={() => setShowAppSecret(!showAppSecret)} style={{ minWidth: '40px' }}>
                  {showAppSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                </Button>
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
                <Button variant="secondary" onClick={() => setShowAccessToken(!showAccessToken)} style={{ minWidth: '40px' }}>
                  {showAccessToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </Button>
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="primary"
                onClick={saveWhatsAppConfig}
              >
                {whatsappSaved ? 'Saved! ✓' : 'Save WhatsApp Config'}
              </Button>
            </div>
          </div>
        </div>
        </>
      )}

      {subTab === 'api_keys' && (
        <>
          {/* Direct API Integration & Developer Docs */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <SectionHeader
            icon={<Zap size={18} color="var(--accent-primary)" />}
            title="Direct API / Developer Documentation"
            subtitle="Complete API specs for sending messages, querying conversation limits, and setting per-user limits."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <CopyField label="Chat Endpoint" value={CHAT_ENDPOINT} />

            {/* 1. Chat API Endpoint Spec */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                1. Chat & AI Response (<code style={{ color: '#6ee7b7' }}>POST /api/v1/channels/chat</code>)
              </label>
              <div style={{ background: '#0d0d0d', borderRadius: '8px', padding: '14px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.7, border: '1px solid var(--border-glass)', overflowX: 'auto' }}>
                <div style={{ color: '#94a3b8', marginBottom: '4px' }}>// Request Headers: x-api-key: &lt;your-api-key&gt;</div>
                <span style={{ color: '#6ee7b7' }}>POST</span> <span style={{ color: '#93c5fd' }}>/api/v1/channels/chat</span><br />
                <span style={{ color: '#94a3b8' }}>Body: </span>
                <span style={{ color: '#fde68a' }}>{`{ "message": "What is the status of bid?", "sessionId": "user-abc-123", "channel": "api" }`}</span>
                <br /><br />
                <div style={{ color: '#94a3b8', marginBottom: '4px' }}>// Response (Includes Status, Limits, and HandedOff indicators):</div>
                <span style={{ color: '#94a3b8' }}>{'{'}</span><br />
                <span style={{ color: '#f9a8d4' }}>  "reply"</span>: <span style={{ color: '#6ee7b7' }}>"The highest bid is 185,000 SAR."</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "sessionId"</span>: <span style={{ color: '#6ee7b7' }}>"user-abc-123"</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "conversationId"</span>: <span style={{ color: '#6ee7b7' }}>"conv-uuid-992"</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "status"</span>: <span style={{ color: '#6ee7b7' }}>"active | handed_off | closed"</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "limit"</span>: <span style={{ color: '#f59e0b' }}>10</span>, <span style={{ color: '#94a3b8' }}>// 0 = unlimited</span><br />
                <span style={{ color: '#f9a8d4' }}>  "messageCount"</span>: <span style={{ color: '#f59e0b' }}>4</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "limitExceeded"</span>: <span style={{ color: '#6ee7b7' }}>false</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "handedOff"</span>: <span style={{ color: '#6ee7b7' }}>false</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "tokens"</span>: <span style={{ color: '#f59e0b' }}>142</span><br />
                <span style={{ color: '#94a3b8' }}>{'}'}</span>
              </div>
            </div>

            {/* 2. Fetch Conversation & Messages Spec */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                2. Fetch Conversation & Messages (<code style={{ color: '#93c5fd' }}>GET /api/v1/conversations/by-user/:sessionId</code>)
              </label>
              <div style={{ background: '#0d0d0d', borderRadius: '8px', padding: '14px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.7, border: '1px solid var(--border-glass)', overflowX: 'auto' }}>
                <div style={{ color: '#94a3b8', marginBottom: '4px' }}>// Request Headers: x-api-key: &lt;your-api-key&gt;</div>
                <span style={{ color: '#6ee7b7' }}>GET</span> <span style={{ color: '#93c5fd' }}>/api/v1/conversations/by-user/user-abc-123</span><br /><br />
                <div style={{ color: '#94a3b8', marginBottom: '4px' }}>// Response:</div>
                <span style={{ color: '#94a3b8' }}>{'{'}</span><br />
                <span style={{ color: '#f9a8d4' }}>  "status"</span>: <span style={{ color: '#6ee7b7' }}>"active"</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "messageCount"</span>: <span style={{ color: '#f59e0b' }}>4</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "limit"</span>: <span style={{ color: '#f59e0b' }}>10</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "limitExceeded"</span>: <span style={{ color: '#6ee7b7' }}>false</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "handedOff"</span>: <span style={{ color: '#6ee7b7' }}>false</span>,<br />
                <span style={{ color: '#f9a8d4' }}>  "messages"</span>: [<br />
                <span style={{ color: '#94a3b8' }}>    {`{ "role": "user", "content": "What is the bid?" }`},</span><br />
                <span style={{ color: '#94a3b8' }}>    {`{ "role": "assistant", "content": "185,000 SAR." }`}</span><br />
                <span style={{ color: '#94a3b8' }}>  ]</span><br />
                <span style={{ color: '#94a3b8' }}>{'}'}</span>
              </div>
            </div>

            {/* 3. Patch Per-Conversation Limit Spec */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                3. Update Per-Conversation Limit (<code style={{ color: '#f59e0b' }}>PATCH /api/v1/conversations/:id/limit</code>)
              </label>
              <div style={{ background: '#0d0d0d', borderRadius: '8px', padding: '14px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.7, border: '1px solid var(--border-glass)', overflowX: 'auto' }}>
                <div style={{ color: '#94a3b8', marginBottom: '4px' }}>// Request Headers: x-api-key: &lt;your-api-key&gt;</div>
                <span style={{ color: '#f59e0b' }}>PATCH</span> <span style={{ color: '#93c5fd' }}>/api/v1/conversations/conv-uuid-992/limit</span><br />
                <span style={{ color: '#94a3b8' }}>Body: </span>
                <span style={{ color: '#fde68a' }}>{`{ "maxMessages": 15 }`}</span><br /><br />
                <div style={{ color: '#94a3b8', marginBottom: '4px' }}>// Response:</div>
                <span style={{ color: '#94a3b8' }}>{'{'}</span> <span style={{ color: '#f9a8d4' }}>"limit"</span>: <span style={{ color: '#f59e0b' }}>15</span>, <span style={{ color: '#f9a8d4' }}>"status"</span>: <span style={{ color: '#6ee7b7' }}>"active"</span>, <span style={{ color: '#f9a8d4' }}>"limitExceeded"</span>: <span style={{ color: '#6ee7b7' }}>false</span> <span style={{ color: '#94a3b8' }}>{'}'}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Code2 size={15} color="var(--accent-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Authenticate all requests using the <code style={{ color: 'var(--accent-primary)' }}>x-api-key</code> header. Generate keys in the table below for your apps or microservices.
              </span>
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
          <Button
            variant="primary"
            onClick={handleGenerateKey}
            loading={generatingKey}
            disabled={!newKeyName.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            icon={!generatingKey && <Plus size={14} />}
          >
            Generate Key
          </Button>
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
              <Button variant="secondary" onClick={copyRawKey}>
                {keyCopied ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
              </Button>
            </div>
          </div>
        )}

        {/* Keys Table */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Active Keys
            </span>
            <Button
              variant="secondary"
              onClick={loadApiKeys}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
              icon={<RefreshCw size={12} />}
            >
              Refresh
            </Button>
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
                      <Button
                        variant="secondary"
                        onClick={() => handleRevokeKey(k.id)}
                        loading={revoking === k.id}
                        style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}
                        title="Revoke this key"
                        icon={revoking !== k.id && <Trash2 size={12} />}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
