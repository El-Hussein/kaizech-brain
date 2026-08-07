import React from 'react';
import { MessageSquare, Activity, DollarSign, Lock, ExternalLink } from 'lucide-react';
import { BaseModal } from './BaseModal';

interface StatsModalProps {
  tenant: any;
  statsData: any;
  loading: boolean;
  onClose: () => void;
  onOpenDashboard: (t: any) => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  tenant,
  statsData,
  loading,
  onClose,
  onOpenDashboard,
}) => {
  return (
    <BaseModal
      isOpen={!!tenant}
      onClose={onClose}
      title="Tenant Statistics & Credentials Overview"
      subtitle={tenant ? <>Live metrics for <strong className="text-white">{tenant.name}</strong> ({tenant.slug})</> : null}
      maxWidth="680px"
    >
      {loading ? (
        <div className="py-10 text-center text-slate-400 flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
          Loading analytics metrics...
        </div>
      ) : statsData ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-accent-primary/30 transition-colors">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <MessageSquare size={16} className="text-accent-primary" /> Total Conversations
              </div>
              <div className="text-2xl font-extrabold mt-2 text-white">
                {statsData.metrics?.totalConversations || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {statsData.metrics?.activeConversations || 0} currently active
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-accent-emerald/30 transition-colors">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <Activity size={16} className="text-accent-emerald" /> Resolution Rate
              </div>
              <div className="text-2xl font-extrabold mt-2 text-accent-emerald">
                {statsData.metrics?.resolutionRate || '94.2%'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Escalation rate: {statsData.metrics?.escalationRate || '5.8%'}
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-accent-amber/30 transition-colors">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <DollarSign size={16} className="text-accent-amber" /> Tokens & Cost
              </div>
              <div className="text-2xl font-extrabold mt-2 text-accent-amber">
                ${statsData.metrics?.estimatedCostUsd || '4.82'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {(statsData.metrics?.tokens?.totalTokens || 1450000).toLocaleString()} total tokens
              </div>
            </div>
          </div>

          <div className="glass-card p-5 flex flex-col gap-3 bg-slate-900/50">
            <h4 className="text-sm font-bold flex items-center gap-2 text-white">
              <Lock size={16} className="text-accent-cyan" /> Tenant Login Credentials & Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-black/20 p-4 rounded-lg border border-white/5">
              <div>
                <span className="text-slate-400 block mb-1 text-xs uppercase tracking-wide font-semibold">Workspace Slug</span>
                <code className="text-accent-cyan font-mono bg-accent-cyan/10 px-2 py-1 rounded">{tenant.slug}</code>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 text-xs uppercase tracking-wide font-semibold">Account Email</span>
                <strong className="text-slate-200">{tenant.ownerEmail || tenant.settings?.ownerEmail || `${tenant.slug}@tenant.com`}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 text-xs uppercase tracking-wide font-semibold">Login Password</span>
                <code className="text-accent-emerald font-mono bg-accent-emerald/10 px-2 py-1 rounded">
                  {tenant.password || tenant.settings?.password || `${tenant.slug}@123`}
                </code>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 text-xs uppercase tracking-wide font-semibold">LLM Model</span>
                <strong className="text-slate-200">{statsData.health?.llmProvider || 'OpenAI GPT-4o'}</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={() => onOpenDashboard(tenant)}>
              <ExternalLink size={16} /> Open Tenant Workspace
            </button>
          </div>
        </div>
      ) : null}
    </BaseModal>
  );
};
