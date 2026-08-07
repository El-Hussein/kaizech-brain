import React from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  borderColor?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '540px',
  borderColor,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-5 animate-in fade-in duration-200">
      <div
        className={`glass-card w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200 p-7`}
        style={{ maxWidth, ...(borderColor ? { borderColor } : {}) }}
      >
        <div className="flex justify-between items-center mb-1 shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-white">{title}</h2>
            {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full self-start"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-5 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
