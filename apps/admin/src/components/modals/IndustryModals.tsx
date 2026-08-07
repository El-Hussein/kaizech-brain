import React from 'react';
import { BaseModal } from './BaseModal';
import { Link, Upload } from 'lucide-react';

interface IndustryCreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  isEdit?: boolean;
  
  name: string; setName: (v: string) => void;
  slug: string; setSlug: (v: string) => void;
  desc: string; setDesc: (v: string) => void;
}

export const IndustryCreateEditModal: React.FC<IndustryCreateEditModalProps> = ({
  isOpen, onClose, onSubmit, saving, isEdit,
  name, setName, slug, setSlug, desc, setDesc
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Industry" : "Create Industry"}
      subtitle={isEdit ? "Update industry details" : "Register a new industry category"}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-2">
        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Industry Name</label>
          <input
            type="text"
            placeholder="e.g. Real Estate"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Industry Slug</label>
          <input
            type="text"
            placeholder="e.g. real-estate"
            className="input-field"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Description</label>
          <textarea
            placeholder="Knowledge and protocols for this industry..."
            className="input-field min-h-[80px]"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Industry')}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

interface IndustryKnowledgeModalProps {
  industry: any;
  type: 'upload' | 'crawl' | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  processing: boolean;

  file: File | null; setFile: (f: File | null) => void;
  url: string; setUrl: (v: string) => void;
  urlName: string; setUrlName: (v: string) => void;
}

export const IndustryKnowledgeModal: React.FC<IndustryKnowledgeModalProps> = ({
  industry, type, onClose, onSubmit, processing,
  file, setFile, url, setUrl, urlName, setUrlName
}) => {
  return (
    <BaseModal
      isOpen={!!industry && !!type}
      onClose={onClose}
      title={type === 'upload' ? 'Upload Industry Document' : 'Crawl Industry Website'}
      subtitle={industry ? <>Add shared knowledge for <strong className="text-white">{industry.name}</strong></> : null}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-2">
        {type === 'upload' && (
          <div>
            <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Select Document</label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-accent-cyan/50 transition-colors bg-white/5 relative">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.txt"
                required
              />
              <Upload size={32} className="mx-auto text-accent-cyan mb-3 opacity-80" />
              <div className="text-sm font-semibold text-white mb-1">
                {file ? file.name : 'Click or drag file to upload'}
              </div>
              <div className="text-xs text-slate-500">
                PDF, DOCX, TXT up to 25MB
              </div>
            </div>
          </div>
        )}

        {type === 'crawl' && (
          <>
            <div>
              <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Website URL</label>
              <input
                type="url"
                placeholder="https://example.com"
                className="input-field"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Source Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Official Documentation"
                className="input-field"
                value={urlName}
                onChange={(e) => setUrlName(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={processing || (type === 'upload' && !file)}>
            {processing ? 'Processing...' : type === 'upload' ? 'Upload & Process' : 'Start Crawling'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};
