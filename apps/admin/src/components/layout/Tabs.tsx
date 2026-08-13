import React from 'react';
import { Users, Building, Mail } from 'lucide-react';

interface Props {
  activeTab: 'tenants' | 'industries' | 'contacts';
  setActiveTab: (tab: 'tenants' | 'industries' | 'contacts') => void;
}

export const Tabs: React.FC<Props> = ({ activeTab, setActiveTab }) => {
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
      <button
        onClick={() => setActiveTab('contacts')}
        className={`flex items-center gap-2 text-[15px] font-semibold transition-all duration-300 pb-1 border-b-2 ${
          activeTab === 'contacts'
            ? 'text-accent-primary border-accent-primary'
            : 'text-slate-400 border-transparent hover:text-slate-200'
        }`}
      >
        <Mail size={16} />
        Contact Leads
      </button>
    </div>
  );
};
