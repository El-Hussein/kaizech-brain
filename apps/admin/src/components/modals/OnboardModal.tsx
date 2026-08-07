import React from 'react';
import { Copy, Check } from 'lucide-react';
import { BaseModal } from './BaseModal';

// I'll extract COMMON_TIMEZONES here for now to avoid circular deps.
export const COMMON_TIMEZONES = [
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (Saudi Arabia — GMT+3)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UAE / Gulf — GMT+4)' },
  { value: 'Asia/Kuwait', label: 'Asia/Kuwait (Kuwait — GMT+3)' },
  { value: 'Asia/Bahrain', label: 'Asia/Bahrain (Bahrain — GMT+3)' },
  { value: 'Asia/Qatar', label: 'Asia/Qatar (Qatar — GMT+3)' },
  { value: 'Asia/Muscat', label: 'Asia/Muscat (Oman — GMT+4)' },
  { value: 'Asia/Amman', label: 'Asia/Amman (Jordan — GMT+3)' },
  { value: 'Asia/Beirut', label: 'Asia/Beirut (Lebanon — GMT+3)' },
  { value: 'Asia/Baghdad', label: 'Asia/Baghdad (Iraq — GMT+3)' },
  { value: 'Africa/Cairo', label: 'Africa/Cairo (Egypt — GMT+3)' },
  { value: 'Africa/Casablanca', label: 'Africa/Casablanca (Morocco — GMT+1)' },
  { value: 'UTC', label: 'UTC (Universal Coordinated Time — GMT+0)' },
  { value: 'Europe/London', label: 'Europe/London (UK — GMT+0/+1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (Central Europe — GMT+1/+2)' },
  { value: 'Europe/Istanbul', label: 'Europe/Istanbul (Turkey — GMT+3)' },
  { value: 'America/New_York', label: 'America/New_York (US Eastern — GMT-5/-4)' },
  { value: 'America/Chicago', label: 'America/Chicago (US Central — GMT-6/-5)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (US Pacific — GMT-8/-7)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (Singapore — GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan — GMT+9)' },
];

interface OnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  creating: boolean;
  result: any;
  copiedKey: string | null;
  copiedPassword: string | null;
  copyKey: (key: string) => void;
  copyPass: (pass: string) => void;
  
  name: string; setName: (v: string) => void;
  slug: string; setSlug: (v: string) => void;
  ownerEmail: string; setOwnerEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  languages: string; setLanguages: (v: string) => void;
  timezone: string; setTimezone: (v: string) => void;
  greetingMessage: string; setGreetingMessage: (v: string) => void;
}

export const OnboardModal: React.FC<OnboardModalProps> = ({
  isOpen, onClose, onSubmit, creating, result,
  copiedKey, copiedPassword, copyKey, copyPass,
  name, setName, slug, setSlug, ownerEmail, setOwnerEmail,
  password, setPassword, languages, setLanguages,
  timezone, setTimezone, greetingMessage, setGreetingMessage
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard New Tenant"
      subtitle="Zero-code customer onboarding. Generates a new tenant workspace, login password, and API Key."
    >
      {result ? (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-5 border-accent-emerald bg-emerald-500/5">
            <div className="text-accent-emerald font-bold text-[15px] mb-2 flex items-center gap-2">
              <span>🎉</span> Tenant '{result.tenant?.name || name || 'New Tenant'}' Onboarded!
            </div>
            <p className="text-slate-400 text-[13px] mb-4 leading-relaxed">
              Store these generated tenant account credentials securely for logging in:
            </p>

            <div className="flex flex-col gap-4 w-full">
              <div>
                <label className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Account Email / Login ID</label>
                <code className="block text-[13px] bg-slate-950 p-2.5 rounded-lg text-slate-200 mt-1 border border-white/5">
                  {result.ownerEmail || ownerEmail || `${slug}@tenant.com`}
                </code>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Account Password</label>
                <div className="flex gap-2 items-center mt-1">
                  <code className="text-[13px] bg-slate-950 p-2.5 rounded-lg flex-1 text-accent-emerald font-semibold border border-white/5">
                    {result.password || password || `${slug}@123`}
                  </code>
                  <button className="btn btn-secondary btn-sm h-10 px-3" onClick={() => copyPass(result.password || password || `${slug}@123`)}>
                    {copiedPassword === (result.password || password || `${slug}@123`) ? <Check size={14} className="text-accent-emerald" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Generated API Key</label>
                <div className="flex gap-2 items-center mt-1">
                  <code className="text-[12px] bg-slate-950 p-2.5 rounded-lg flex-1 text-accent-cyan break-all border border-white/5 font-mono">
                    {result.apiKey}
                  </code>
                  <button className="btn btn-secondary btn-sm h-[42px] px-3 shrink-0" onClick={() => copyKey(result.apiKey)}>
                    {copiedKey === result.apiKey ? <Check size={14} className="text-accent-emerald" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary w-full justify-center p-3 mt-2" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Business Name</label>
            <input
              type="text"
              placeholder="e.g. Mrkoon Auctions"
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
              placeholder="e.g. mrkoon-auctions"
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
              placeholder="admin@mrkoon.com"
              className="input-field"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Tenant Account Password</label>
            <input
              type="text"
              placeholder="Set password (e.g. mrkoon@123)"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              If left blank, will default to <code className="bg-white/5 px-1 rounded">slug@123</code>
            </span>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-slate-400 block mb-1.5">Supported Languages (comma-separated)</label>
            <input
              type="text"
              placeholder="en, ar"
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
              placeholder="Welcome to Mrkoon Auctions! How can I help you today?"
              className="input-field min-h-[60px]"
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Provisioning...' : 'Provision Tenant'}
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
};
