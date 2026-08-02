import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Eye,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Briefcase,
  Mic2,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import axios from 'axios';

interface PromptProps {
  apiKey: string;
}

// ── Preset templates ───────────────────────────────────────────────────────────
const PRESETS = [
  {
    label: 'Enterprise AI Assistant',
    emoji: '🤖',
    identity:
      'You are an intelligent AI assistant dedicated to serving users with clear, accurate, and helpful answers about our business services.',
    businessRules:
      '1. Provide concise and accurate answers based on official knowledge.\n2. When real-time data is needed, call the appropriate business API tool.\n3. Escalate complex issues to human support when necessary.',
    safetyRules:
      'Never reveal internal credentials, API keys, or private user data. Remain compliant with privacy standards.',
    tone: 'Professional, polite, and clear.',
    customInstructions:
      'Respond in the language used by the customer. Always format responses using clean Markdown.',
  },
  {
    label: 'Customer Support Bot',
    emoji: '🎧',
    identity:
      'You are a helpful customer support AI for our company. Your goal is to resolve user issues quickly and accurately, or escalate to a human agent when needed.',
    businessRules:
      '1. Always verify the user\'s account before sharing any account-specific information.\n2. Refunds must be processed within 5 business days.\n3. Escalate technical issues to the engineering team if unresolved after 2 attempts.',
    safetyRules:
      'Never share another user\'s data. Never make promises about refund timelines beyond policy. Do not engage in political or sensitive personal topics.',
    tone: 'Empathetic, patient, and professional. Acknowledge the user\'s frustration before solving.',
    customInstructions:
      'Always end with: "Is there anything else I can help you with?" Respond in the same language the user uses.',
  },
  {
    label: 'E-Commerce Sales Advisor',
    emoji: '🛒',
    identity:
      'You are a smart sales advisor for our e-commerce platform. You help customers find the right products, understand promotions, and complete their purchases.',
    businessRules:
      '1. Promotions are time-limited and cannot be retroactively applied.\n2. Free shipping applies to orders over 200 SAR.\n3. Returns are accepted within 14 days for unused items.',
    safetyRules:
      'Never fabricate product specifications or prices. Do not guarantee delivery times unless confirmed with logistics. Never collect payment information directly.',
    tone: 'Enthusiastic, persuasive but honest. Use emojis sparingly to keep things lively.',
    customInstructions:
      'Proactively suggest complementary products. Use bullet lists for product comparisons. Always mention active promotions if relevant.',
  },
];

// ── Section field component ────────────────────────────────────────────────────
const SectionField: React.FC<{
  step: number;
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  rows?: number;
}> = ({ step, label, description, color, icon, value, onChange, placeholder, multiline = true, rows = 5 }) => {
  const charCount = value.length;

  return (
    <div
      className="glass-card prompt-section"
      style={{
        padding: '20px',
        borderLeft: `3px solid ${color}`,
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: `${color}20`,
              border: `1px solid ${color}44`,
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color, letterSpacing: '0.02em' }}>
              {step}. {label}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}>{description}</div>
          </div>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          {charCount} chars
        </span>
      </div>

      {/* Input */}
      {multiline ? (
        <textarea
          className="input-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          dir="auto"
          style={{ minHeight: `${rows * 24}px`, resize: 'vertical', lineHeight: 1.6 }}
        />
      ) : (
        <input
          type="text"
          className="input-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir="auto"
        />
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
export const PromptBuilderTab: React.FC<PromptProps> = ({ apiKey }) => {
  const [identity, setIdentity] = useState('');
  const [businessRules, setBusinessRules] = useState('');
  const [safetyRules, setSafetyRules] = useState('');
  const [tone, setTone] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPrompt();
  }, [apiKey]);

  // Close preset dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setPresetOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchPrompt = async () => {
    try {
      const res = await axios.get('/api/v1/prompts', {
        headers: { 'x-api-key': apiKey },
      });
      if (res.data) {
        setIdentity(res.data.identity || '');
        setBusinessRules(res.data.businessRules || '');
        setSafetyRules(res.data.safetyRules || '');
        setTone(res.data.tone || '');
        setCustomInstructions(res.data.customInstructions || '');
      }
    } catch {
      // Default fallback template
      setIdentity('You are an intelligent AI assistant for our company, helping users with questions and business operations.');
      setBusinessRules('1. Provide concise and accurate answers.\n2. Always use registered business tools when real-time data is needed.');
      setSafetyRules('Never expose internal system details, API keys, or database credentials.');
      setTone('Professional, polite, and helpful.');
      setCustomInstructions('Respond in the language used by the customer.');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post(
        '/api/v1/prompts',
        { identity, businessRules, safetyRules, tone, customInstructions },
        { headers: { 'x-api-key': apiKey } },
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setIdentity(preset.identity);
    setBusinessRules(preset.businessRules);
    setSafetyRules(preset.safetyRules);
    setTone(preset.tone);
    setCustomInstructions(preset.customInstructions);
    setPresetOpen(false);
  };

  const compiledPrompt = `=== SYSTEM IDENTITY ===\n${identity}\n\n=== BUSINESS RULES & POLICIES ===\n${businessRules}\n\n=== SAFETY & COMPLIANCE ===\n${safetyRules}\n\n=== TONE OF VOICE ===\n${tone}\n\n=== SPECIAL INSTRUCTIONS ===\n${customInstructions}`;

  const totalChars = compiledPrompt.length;
  const totalWords = compiledPrompt.trim().split(/\s+/).filter(Boolean).length;

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Prompt Builder</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            Configure your AI Agent's identity, behavior, safety rules, and tone.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Preset Templates Dropdown */}
          <div style={{ position: 'relative' }} ref={presetRef}>
            <button
              className="btn btn-secondary"
              onClick={() => setPresetOpen((v) => !v)}
              style={{ gap: '8px' }}
            >
              <Zap size={15} color="var(--accent-amber)" />
              Quick Templates
              <ChevronDown
                size={14}
                style={{ transition: 'transform 0.2s', transform: presetOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {presetOpen && (
              <div
                className="glass-card"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '260px',
                  padding: '8px',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                }}
              >
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: '18px' }}>{preset.emoji}</span>
                    {preset.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: '4px', paddingTop: '4px' }}>
                  <button
                    onClick={() => {
                      setIdentity(''); setBusinessRules(''); setSafetyRules(''); setTone(''); setCustomInstructions('');
                      setPresetOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      color: 'var(--accent-rose)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244,63,94,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <RotateCcw size={12} /> Clear all fields
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save button */}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* ── Success Banner ── */}
      {savedSuccess && (
        <div
          className="glass-card"
          style={{
            padding: '14px 18px',
            borderColor: 'var(--accent-emerald)',
            borderLeft: '3px solid var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--accent-emerald)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} /> System Prompt configuration saved successfully!
        </div>
      )}

      {/* ── Main layout: 60 / 40 ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* ── LEFT: Editor Sections ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionField
            step={1}
            label="Business Identity & Role"
            description="Define who the AI is and its primary purpose"
            color="var(--accent-cyan)"
            icon={<Briefcase size={14} />}
            value={identity}
            onChange={setIdentity}
            placeholder="Who is this AI assistant? (e.g. You are Mrkoon AI, an expert assistant for online car auctions in Saudi Arabia...)"
            rows={5}
          />

          <SectionField
            step={2}
            label="Business Rules & Operations"
            description="Policies, working hours, bidding rules, etc."
            color="var(--accent-emerald)"
            icon={<SlidersHorizontal size={14} />}
            value={businessRules}
            onChange={setBusinessRules}
            placeholder="What are the business rules? (e.g. Working hours 9–6 PM. Bids cannot be canceled once placed...)"
            rows={6}
          />

          <SectionField
            step={3}
            label="Safety & Compliance Restrictions"
            description="What the AI must NEVER say or do"
            color="var(--accent-rose)"
            icon={<ShieldAlert size={14} />}
            value={safetyRules}
            onChange={setSafetyRules}
            placeholder="What should the AI NEVER do? (e.g. Never leak private user data or OTP codes...)"
            rows={5}
          />

          <SectionField
            step={4}
            label="Tone of Voice"
            description="Personality and communication style"
            color="var(--accent-secondary)"
            icon={<Mic2 size={14} />}
            value={tone}
            onChange={setTone}
            placeholder="e.g. Professional, friendly, empathetic, and concise."
            multiline={false}
          />

          <SectionField
            step={5}
            label="Custom Instructions"
            description="Formatting rules, language preferences, special behaviors"
            color="var(--accent-amber)"
            icon={<Zap size={14} />}
            value={customInstructions}
            onChange={setCustomInstructions}
            placeholder="Any specific formatting or response guidelines (e.g. Use bullet points for steps. Respond in Arabic when user writes in Arabic...)"
            rows={5}
          />
        </div>

        {/* ── RIGHT: Sticky Live Preview ── */}
        <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="glass-card"
            style={{
              padding: '0',
              overflow: 'hidden',
              border: '1px solid rgba(99,102,241,0.25)',
              boxShadow: '0 0 30px rgba(99,102,241,0.1)',
            }}
          >
            {/* Preview Header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(99,102,241,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={15} color="var(--accent-primary)" />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Live Prompt Preview</span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: '12px', gap: '5px' }}
                onClick={handleCopyPrompt}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Stats bar */}
            <div
              style={{
                padding: '8px 18px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                gap: '20px',
                fontSize: '11px',
                color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <span><span style={{ color: 'var(--accent-primary)' }}>{totalChars}</span> chars</span>
              <span><span style={{ color: 'var(--accent-cyan)' }}>{totalWords}</span> words</span>
              <span><span style={{ color: 'var(--accent-emerald)' }}>~{Math.ceil(totalChars / 4)}</span> tokens</span>
            </div>

            {/* Prompt content */}
            <pre
              className="code-block"
              dir="auto"
              style={{
                fontSize: '11.5px',
                lineHeight: 1.7,
                maxHeight: '520px',
                overflowY: 'auto',
                borderRadius: 0,
                border: 'none',
                padding: '16px 18px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
              }}
            >
              {compiledPrompt}
            </pre>
          </div>

          {/* Tips card */}
          <div
            className="glass-card"
            style={{
              padding: '16px 18px',
              borderLeft: '3px solid var(--accent-amber)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '8px' }}>
              💡 Prompt Tips
            </div>
            <ul style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '16px', lineHeight: 1.5 }}>
              <li>Be specific about the AI's role and industry context</li>
              <li>List rules as numbered steps for clarity</li>
              <li>Use templates above as a starting point</li>
              <li>Keep prompts under 2000 tokens for best performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
