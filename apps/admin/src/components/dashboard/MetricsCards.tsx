import React from 'react';
import { Users, Cpu, Activity } from 'lucide-react';

interface MetricsCardsProps {
  activeTenantsCount: number;
  totalTenantsCount: number;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ activeTenantsCount, totalTenantsCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="glass-card p-6">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
            Active Tenants
          </span>
          <div className="p-2 bg-accent-primary/10 rounded-lg">
            <Users size={20} className="text-accent-primary" />
          </div>
        </div>
        <div className="text-4xl font-extrabold mt-4 text-white">
          {activeTenantsCount} <span className="text-lg text-slate-500 font-medium">/ {totalTenantsCount}</span>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          100% Multi-tenant Isolated
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
            Total AI Agents
          </span>
          <div className="p-2 bg-accent-cyan/10 rounded-lg">
            <Cpu size={20} className="text-accent-cyan" />
          </div>
        </div>
        <div className="text-4xl font-extrabold mt-4 text-white">
          {totalTenantsCount}
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
          OpenAI GPT-4o Powered
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
            Platform Status
          </span>
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Activity size={20} className="text-emerald-400" />
          </div>
        </div>
        <div className="text-4xl font-extrabold mt-4 text-emerald-400">
          Healthy
        </div>
        <span className="text-slate-500 text-sm mt-4 block font-medium">
          PostgreSQL + pgvector + Redis
        </span>
      </div>
    </div>
  );
};
