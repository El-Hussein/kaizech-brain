import React from 'react';
import { TenantCard } from './TenantCard';

interface TenantListProps {
  tenants: any[];
  loading: boolean;
  showPasswords: Record<string, boolean>;
  togglePasswordVisibility: (id: string) => void;
  onOpenStats: (t: any) => void;
  onOpenDashboard: (t: any) => void;
  onToggleStatus: (t: any) => void;
  onEdit: (t: any) => void;
  onGenerateKey: (t: any) => void;
  onDelete: (t: any) => void;
}

export const TenantList: React.FC<TenantListProps> = ({
  tenants,
  loading,
  showPasswords,
  togglePasswordVisibility,
  onOpenStats,
  onOpenDashboard,
  onToggleStatus,
  onEdit,
  onGenerateKey,
  onDelete,
}) => {
  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">
          Registered Customer Tenants ({tenants.length})
        </h2>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
          Loading tenant registry...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tenants.map((t) => (
            <TenantCard
              key={t.id}
              tenant={t}
              showPassword={!!showPasswords[t.id]}
              togglePasswordVisibility={togglePasswordVisibility}
              onOpenStats={onOpenStats}
              onOpenDashboard={onOpenDashboard}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onGenerateKey={onGenerateKey}
              onDelete={onDelete}
            />
          ))}
          {tenants.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-white/5 rounded-xl border border-white/5">
              No tenants found. Click "Onboard New Tenant" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
