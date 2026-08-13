import React from 'react';
import { Mail, Briefcase, Calendar, CheckCircle } from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companySize: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Props {
  contacts: Contact[];
  loading: boolean;
}

export const ContactList: React.FC<Props> = ({ contacts, loading }) => {
  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">
          Website Contact Leads ({contacts.length})
        </h2>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
          Loading leads...
        </div>
      ) : contacts.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white/5 rounded-xl border border-white/5">
          <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
          No leads yet. Contact requests from the landing page will appear here.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-slate-900/50 border border-white/10 rounded-xl p-5 hover:bg-slate-800/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center font-bold">
                    {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-[15px]">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Mail size={12}/> {contact.email}</span>
                      <span className="flex items-center gap-1"><Briefcase size={12}/> {contact.companySize}</span>
                      <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(contact.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <span className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold \${contact.status === 'new' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}\`}>
                  <CheckCircle size={12} />
                  {contact.status.toUpperCase()}
                </span>
              </div>
              <div className="mt-4 p-3 bg-black/20 rounded-lg text-sm text-slate-300 border border-white/5">
                {contact.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
