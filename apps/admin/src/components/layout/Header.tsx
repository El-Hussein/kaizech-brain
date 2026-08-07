import React from 'react';
import { ShieldCheck, Plus } from 'lucide-react';

interface HeaderProps {
  activeTab: 'tenants' | 'industries';
  onOnboardClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onOnboardClick }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="flex items-center gap-3">
          <ShieldCheck size={32} className="text-accent-primary" />
          <h1 className="text-3xl font-extrabold bg-gradient-brand bg-clip-text text-transparent drop-shadow-md">
            Kaizech Brain — Platform Super Admin
          </h1>
        </div>
        <p className="text-slate-400 mt-2 text-sm font-medium">
          Multi-tenant AI Agent Platform Console. Manage tenants, issue API keys, set tenant passwords, and monitor global metrics.
        </p>
      </div>

      {activeTab === 'tenants' && (
        <button
          className="btn btn-primary shadow-glow-primary hover:-translate-y-1 transition-transform"
          onClick={onOnboardClick}
        >
          <Plus size={18} /> Onboard New Tenant (Zero Code)
        </button>
      )}
    </div>
  );
};
