import React from 'react';
import { 
  CheckCircle2, PauseCircle, PlayCircle, Eye, EyeOff, 
  BarChart3, ExternalLink, Pencil, Key, Trash2 
} from 'lucide-react';

interface TenantCardProps {
  tenant: any;
  showPassword: boolean;
  togglePasswordVisibility: (id: string) => void;
  onOpenStats: (t: any) => void;
  onOpenDashboard: (t: any) => void;
  onToggleStatus: (t: any) => void;
  onEdit: (t: any) => void;
  onGenerateKey: (t: any) => void;
  onDelete: (t: any) => void;
}

export const TenantCard: React.FC<TenantCardProps> = ({
  tenant,
  showPassword,
  togglePasswordVisibility,
  onOpenStats,
  onOpenDashboard,
  onToggleStatus,
  onEdit,
  onGenerateKey,
  onDelete,
}) => {
  const isActive = tenant.status === 'active';

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-5 bg-white/5 border border-white/10 rounded-2xl gap-4 hover:border-accent-primary/40 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="text-lg font-bold text-white truncate">{tenant.name}</div>
          <span className={`badge ${isActive ? 'badge-success' : 'badge-amber'}`}>
            {isActive ? <CheckCircle2 size={14} /> : <PauseCircle size={14} />}
            {isActive ? 'Active' : 'Dashboard Paused'}
          </span>
        </div>

        <div className="text-slate-400 text-sm mt-2 flex flex-wrap gap-x-3 gap-y-1 items-center">
          <span>Slug: <code className="text-accent-cyan bg-accent-cyan/10 px-1.5 py-0.5 rounded">{tenant.slug}</code></span>
          <span className="text-slate-600">|</span>
          <span>Email: <span className="text-slate-200 font-medium">{tenant.ownerEmail || tenant.settings?.ownerEmail || `${tenant.slug}@tenant.com`}</span></span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5">
            Password: 
            <code className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono text-xs">
              {showPassword ? tenant.password || tenant.settings?.password || `${tenant.slug}@123` : '••••••••'}
            </code>
            <button
              onClick={() => togglePasswordVisibility(tenant.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </span>
        </div>

        <div className="text-slate-500 text-xs mt-2 break-all">
          Timezone: <span className="text-slate-400">{tenant.timezone}</span> | Languages: <span className="text-slate-400">{Array.isArray(tenant.languages) ? tenant.languages.join(', ') : tenant.languages}</span> | API Endpoint: <span className="text-slate-400">{tenant.apiEndpoint || 'None configured'}</span>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2 shrink-0">
        <button className="btn btn-secondary btn-sm group-hover:bg-white/5" onClick={() => onOpenStats(tenant)} title="View Tenant Statistics & Analytics">
          <BarChart3 size={14} className="text-accent-cyan" /> Overview & Stats
        </button>
        <button className="btn btn-secondary btn-sm border-accent-primary/30 hover:border-accent-primary/60" onClick={() => onOpenDashboard(tenant)} title="Open Tenant Dashboard Workspace">
          <ExternalLink size={14} className="text-accent-primary" /> Open Dashboard
        </button>
        <button className={`btn btn-sm ${isActive ? 'btn-warning' : 'btn-secondary'}`} onClick={() => onToggleStatus(tenant)} title={isActive ? 'Pause Tenant Dashboard Access' : 'Resume Tenant Dashboard Access'}>
          {isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />} {isActive ? 'Pause' : 'Resume'}
        </button>
        <button className="btn btn-secondary btn-sm group-hover:bg-white/5" onClick={() => onEdit(tenant)} title="Edit Tenant Details & Password">
          <Pencil size={14} /> Edit
        </button>
        <button className="btn btn-secondary btn-sm group-hover:bg-white/5" onClick={() => onGenerateKey(tenant)} title="Issue API Key">
          <Key size={14} /> API Key
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(tenant)} title="Delete Tenant">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
};
