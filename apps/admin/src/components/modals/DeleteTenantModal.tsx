import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BaseModal } from './BaseModal';

interface DeleteTenantModalProps {
  tenant: any;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}

export const DeleteTenantModal: React.FC<DeleteTenantModalProps> = ({
  tenant, onClose, onDelete, deleting
}) => {
  return (
    <BaseModal
      isOpen={!!tenant}
      onClose={onClose}
      title=""
      maxWidth="440px"
      borderColor="var(--accent-rose)"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
          <AlertTriangle size={22} className="text-accent-rose" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-white">Delete Tenant?</h3>
          <p className="text-slate-400 text-sm">This action will soft-delete the tenant workspace.</p>
        </div>
      </div>

      <p className="text-sm text-slate-200 mb-6 leading-relaxed">
        Are you sure you want to delete <strong className="text-white">{tenant?.name}</strong>? Their API keys and dashboard access will be disabled.
      </p>

      <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
        <button className="btn btn-secondary" onClick={onClose} disabled={deleting}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
    </BaseModal>
  );
};
