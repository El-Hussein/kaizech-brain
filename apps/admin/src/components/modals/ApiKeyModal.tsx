import React from 'react';
import { Copy, Check } from 'lucide-react';
import { BaseModal } from './BaseModal';

interface ApiKeyModalProps {
  tenant: any;
  onClose: () => void;
  generatingKey: boolean;
  generatedKeyResult: any;
  copiedKey: string | null;
  copyKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  tenant, onClose, generatingKey, generatedKeyResult, copiedKey, copyKey
}) => {
  return (
    <BaseModal
      isOpen={!!tenant}
      onClose={onClose}
      title={`API Key for ${tenant?.name}`}
      subtitle="New secret key generated for tenant integration:"
      maxWidth="520px"
    >
      {generatingKey ? (
        <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
          Generating secure key...
        </div>
      ) : generatedKeyResult ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-center w-full mt-2">
            <code className="text-[13px] bg-slate-950 p-3 rounded-lg flex-1 min-w-0 break-all color-accent-cyan border border-accent-cyan/25 font-mono select-all text-accent-cyan">
              {generatedKeyResult.apiKey}
            </code>
            <button
              className="btn btn-secondary h-11 px-4 shrink-0 hover:border-accent-cyan/50"
              onClick={() => copyKey(generatedKeyResult.apiKey)}
            >
              {copiedKey === generatedKeyResult.apiKey ? (
                <><Check size={16} className="text-accent-emerald" /> Copied!</>
              ) : (
                <><Copy size={16} /> Copy</>
              )}
            </button>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : null}
    </BaseModal>
  );
};
