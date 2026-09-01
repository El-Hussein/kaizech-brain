import React from 'react';
import { BaseModal } from './BaseModal';
import { COMMON_TIMEZONES } from './OnboardModal';
import { InterviewQuestionsManager } from '../tenants/InterviewQuestionsManager';

interface EditTenantModalProps {
  tenant: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;

  name: string; setName: (v: string) => void;
  slug: string; setSlug: (v: string) => void;
  ownerEmail: string; setOwnerEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  languages: string; setLanguages: (v: string) => void;
  timezone: string; setTimezone: (v: string) => void;
  greetingMessage: string; setGreetingMessage: (v: string) => void;
  businessDescription?: string; setBusinessDescription?: (v: string) => void;
  industries: any[];
  mainIndustryId: string; setMainIndustryId: (v: string) => void;
  relatedIndustryIds: string[]; setRelatedIndustryIds: (v: string[]) => void;
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  tenant, onClose, onSubmit, saving,
  name, setName, slug, setSlug, ownerEmail, setOwnerEmail,
  password, setPassword, languages, setLanguages,
  timezone, setTimezone, greetingMessage, setGreetingMessage,
  businessDescription = '', setBusinessDescription,
  industries, mainIndustryId, setMainIndustryId,
  relatedIndustryIds, setRelatedIndustryIds
}) => {
  return (
    <BaseModal
      isOpen={!!tenant}
      onClose={onClose}
      title="Edit Tenant Configuration"
      subtitle={tenant ? <>Update parameters and login credentials for <strong className="text-white">{tenant.name}</strong>.</> : null}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Business Name</label>
          <input
            type="text"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Tenant Slug (Unique ID)</label>
          <input
            type="text"
            className="input-field"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Account Owner Email</label>
          <input
            type="email"
            className="input-field"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Account Login Password (Reset)</label>
          <input
            type="text"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set new login password"
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Supported Languages (comma-separated)</label>
          <input
            type="text"
            className="input-field"
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Timezone</label>
          <select
            className="input-field bg-slate-900 cursor-pointer appearance-none"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {!COMMON_TIMEZONES.some((tz) => tz.value === timezone) && (
              <option value={timezone} className="bg-slate-800 text-white">
                {timezone} (Current)
              </option>
            )}
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value} className="bg-slate-800 text-white">
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Welcome Greeting Message</label>
          <textarea
            className="input-field min-h-[60px]"
            value={greetingMessage}
            onChange={(e) => setGreetingMessage(e.target.value)}
          />
        </div>

        {setBusinessDescription && (
          <div>
            <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Business Description (For Voice AI)</label>
            <textarea
              className="input-field min-h-[80px]"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Describe what the business does, to generate default interview questions..."
            />
          </div>
        )}

        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Main Industry</label>
          <select
            className="input-field bg-slate-900 cursor-pointer appearance-none"
            value={mainIndustryId}
            onChange={(e) => setMainIndustryId(e.target.value)}
          >
            <option value="" className="bg-slate-800 text-slate-400">-- Select Main Industry --</option>
            {industries.map((ind) => (
              <option key={ind.id} value={ind.id} className="bg-slate-800 text-white">
                {ind.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Related Industries (Hold Cmd/Ctrl to select multiple)</label>
          <select
            multiple
            className="input-field bg-slate-900 cursor-pointer min-h-[100px]"
            value={relatedIndustryIds}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              setRelatedIndustryIds(values);
            }}
          >
            {industries.map((ind) => (
              <option key={ind.id} value={ind.id} className="bg-slate-800 text-white p-2 border-b border-white/5">
                {ind.name}
              </option>
            ))}
          </select>
        </div>

        {tenant && (
          <InterviewQuestionsManager 
            tenantId={tenant.id} 
            businessDescription={businessDescription}
          />
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};
