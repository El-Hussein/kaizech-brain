import React from 'react';
import { Users, Building } from 'lucide-react';

interface TabsProps {
  activeTab: 'tenants' | 'industries';
  setActiveTab: (tab: 'tenants' | 'industries') => void;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex gap-4 border-b border-white/10 pb-3 mb-6 mt-6">
      <button
        onClick={() => setActiveTab('tenants')}
        className={`flex items-center gap-2 text-[15px] font-semibold transition-all duration-300 pb-1 border-b-2 ${
          activeTab === 'tenants'
            ? 'text-accent-primary border-accent-primary'
            : 'text-slate-400 border-transparent hover:text-slate-200'
        }`}
      >
        <Users size={16} />
        Tenants Management
      </button>
      <button
        onClick={() => setActiveTab('industries')}
        className={`flex items-center gap-2 text-[15px] font-semibold transition-all duration-300 pb-1 border-b-2 ${
          activeTab === 'industries'
            ? 'text-accent-cyan border-accent-cyan'
            : 'text-slate-400 border-transparent hover:text-slate-200'
        }`}
      >
        <Building size={16} />
        Industries & Knowledge
      </button>
    </div>
  );
};
