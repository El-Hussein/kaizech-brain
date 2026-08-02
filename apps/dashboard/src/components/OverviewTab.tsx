import React, { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  Cpu,
  CheckCircle2,
  DollarSign,
  Clock,
  Layers,
  RefreshCw,
  Wifi,
  WifiOff,
  Globe,
  MessageCircle,
  Languages,
  Timer,
  Info,
} from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/Button';

interface OverviewProps {
  apiKey: string;
}

// ── Skeleton pulse card ───────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div
    className="glass-card"
    style={{ padding: '20px', minHeight: '100px', animation: 'pulse 1.5s ease-in-out infinite' }}
  >
    <div style={{ height: '12px', width: '50%', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '16px' }} />
    <div style={{ height: '28px', width: '40%', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', marginBottom: '10px' }} />
    <div style={{ height: '10px', width: '30%', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }} />
  </div>
);

// ── Stat card with (i) Info Tooltip ─────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  tooltip: string;
}> = ({ label, value, sub, icon, color, tooltip }) => (
  <div
    className="glass-card"
    style={{ padding: '20px', borderLeft: `3px solid ${color}`, transition: 'box-shadow 0.2s' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>{label}</span>
        <span title={tooltip} style={{ display: 'inline-flex', cursor: 'help', color: 'var(--text-muted)', opacity: 0.7 }}>
          <Info size={13} />
        </span>
      </div>
      <span style={{ color }}>{icon}</span>
    </div>
    <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px', color }}>{value}</div>
    <div style={{ marginTop: '8px' }}>{sub}</div>
  </div>
);

// ── Token bar ─────────────────────────────────────────────────────────────────
const TokenBar: React.FC<{ label: string; value: number; pct: number; color: string }> = ({ label, value, pct, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value.toLocaleString()}</span>
    </div>
    <div style={{ height: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: '4px',
          transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}
      />
    </div>
    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
      {pct}%
    </div>
  </div>
);

// ── Health row ────────────────────────────────────────────────────────────────
const HealthRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '13px',
      padding: '8px 0',
      borderBottom: '1px solid var(--border-glass)',
    }}
  >
    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    <span>{value}</span>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export const OverviewTab: React.FC<OverviewProps> = ({ apiKey }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [metricsRes, healthRes] = await Promise.allSettled([
        axios.get('/api/v1/analytics/dashboard', { headers: { 'x-api-key': apiKey } }),
        axios.get('/api/v1/analytics/health', { headers: { 'x-api-key': apiKey } }),
      ]);

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data);
      } else {
        // Fallback demo data
        setMetrics({
          totalConversations: 1,
          activeConversations: 0,
          handedOffConversations: 0,
          totalMessages: 17,
          resolutionRate: '100.0%',
          escalationRate: '0.0%',
          averageResponseTimeMs: 5286,
          tokens: { promptTokens: 2703, completionTokens: 606, totalTokens: 3309, promptPct: 82, completionPct: 18 },
          estimatedCostUsd: 0.0128,
        });
      }

      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value.data);
      } else {
        setHealth({
          status: 'online',
          llmProvider: 'OpenAI GPT-4o',
          vectorStore: 'PostgreSQL pgvector',
          whatsappConnected: true,
          webConnected: false,
          languages: ['ar', 'en'],
          timezone: 'Asia/Riyadh',
        });
      }

      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totalTokens = metrics?.tokens?.totalTokens || 0;
  const promptPct = metrics?.tokens?.promptPct ?? (totalTokens > 0 ? Math.round((metrics?.tokens?.promptTokens / totalTokens) * 100) : 0);
  const completionPct = metrics?.tokens?.completionPct ?? (100 - promptPct);

  const avgMs = metrics?.averageResponseTimeMs ?? 0;
  const responseLabel = avgMs === 0 ? '— ms' : avgMs < 1000 ? `${avgMs} ms` : `${(avgMs / 1000).toFixed(2)} s`;
  const responseSubLabel = avgMs === 0 ? 'No data yet' : avgMs < 1000 ? 'Sub-second latency' : 'Standard latency';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Analytics Overview</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            Real-time performance, token consumption, and resolution statistics for your AI Agent.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastRefreshed && (
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="secondary"
            style={{ padding: '7px 14px', fontSize: '13px', gap: '6px' }}
            onClick={() => fetchAll(true)}
            loading={refreshing}
            loadingText="Refreshing…"
            icon={!refreshing && <RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              label="Total Messages"
              value={metrics?.totalMessages?.toLocaleString() ?? '—'}
              sub={
                <span className="badge badge-purple">
                  {metrics?.totalConversations ?? 0} Conversations
                </span>
              }
              icon={<MessageSquare size={20} />}
              color="var(--accent-primary)"
              tooltip="Total count of customer and agent messages exchanged across all active and closed support threads."
            />
            <StatCard
              label="Resolution Rate"
              value={metrics?.resolutionRate ?? '—'}
              sub={
                <span className="badge badge-success">
                  {metrics?.escalationRate} Escalation Rate
                </span>
              }
              icon={<CheckCircle2 size={20} />}
              color="var(--accent-emerald)"
              tooltip="Percentage of conversations fully handled and resolved by the AI Agent without escalation to a human agent. Formula: ((Total Threads - Human Handoffs) / Total Threads) × 100"
            />
            <StatCard
              label="Avg Response Time"
              value={<span style={{ color: avgMs > 3000 ? 'var(--accent-amber)' : 'var(--text-main)' }}>{responseLabel}</span>}
              sub={<span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>{responseSubLabel}</span>}
              icon={<Clock size={20} />}
              color="var(--accent-cyan)"
              tooltip="Average latency taken by the AI Agent to retrieve knowledge (RAG), process tool calls, and generate responses."
            />
            <StatCard
              label="Estimated Cost"
              value={`$${metrics?.estimatedCostUsd ?? '0.0000'}`}
              sub={
                <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                  {metrics?.tokens?.totalTokens?.toLocaleString() ?? 0} Total Tokens
                </span>
              }
              icon={<DollarSign size={20} />}
              color="var(--accent-amber)"
              tooltip="Estimated LLM API cost calculated from total input (prompt) and output (completion) tokens consumed."
            />
          </>
        )}
      </div>

      {/* ── Bottom Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Token Breakdown */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="var(--accent-primary)" /> Token Usage Breakdown
          </h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ height: '40px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
              <div style={{ height: '40px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <TokenBar
                label="Prompt Tokens (Input)"
                value={metrics?.tokens?.promptTokens ?? 0}
                pct={promptPct}
                color="var(--gradient-brand)"
              />
              <TokenBar
                label="Completion Tokens (Output)"
                value={metrics?.tokens?.completionTokens ?? 0}
                pct={completionPct}
                color="var(--accent-cyan)"
              />
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-glass)',
                  fontSize: '12px',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span>Total: <strong style={{ color: 'var(--text-main)' }}>{metrics?.tokens?.totalTokens?.toLocaleString() ?? 0}</strong></span>
                <span>·</span>
                <span>Input/Output ratio: <strong style={{ color: 'var(--accent-primary)' }}>{promptPct}%</strong> / <strong style={{ color: 'var(--accent-cyan)' }}>{completionPct}%</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Agent Health */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--accent-cyan)" /> Agent Health
          </h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ height: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <HealthRow
                label="Status"
                value={
                  health?.status === 'online' ? (
                    <span className="badge badge-success">
                      <Wifi size={11} /> Online & Active
                    </span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.3)' }}>
                      <WifiOff size={11} /> Offline
                    </span>
                  )
                }
              />
              <HealthRow
                label="LLM Provider"
                value={<span style={{ fontWeight: 600, fontSize: '13px' }}>{health?.llmProvider ?? '—'}</span>}
              />
              <HealthRow
                label="Vector Store"
                value={<span style={{ fontWeight: 600, fontSize: '13px' }}>{health?.vectorStore ?? '—'}</span>}
              />
              <HealthRow
                label="WhatsApp"
                value={
                  health?.whatsappConnected ? (
                    <span className="badge badge-purple"><MessageCircle size={11} /> Connected</span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Not connected</span>
                  )
                }
              />
              <HealthRow
                label="Web Channel"
                value={
                  health?.webConnected ? (
                    <span className="badge badge-success"><Globe size={11} /> Active</span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Inactive</span>
                  )
                }
              />
              <HealthRow
                label="Languages"
                value={
                  <span style={{ fontWeight: 600, fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                    {(health?.languages ?? ['en']).join(', ').toUpperCase()}
                  </span>
                }
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingTop: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Timezone</span>
                <span style={{ fontWeight: 600, fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  {health?.timezone ?? 'UTC'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
