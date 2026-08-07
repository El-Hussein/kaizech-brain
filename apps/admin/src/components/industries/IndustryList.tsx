import React from 'react';
import { CheckCircle2, PauseCircle, Upload, Link as LinkIcon, Pencil, Trash2, Plus } from 'lucide-react';

interface IndustryListProps {
  industries: any[];
  loading: boolean;
  onCreateClick: () => void;
  onUploadClick: (ind: any) => void;
  onCrawlClick: (ind: any) => void;
  onEditClick: (ind: any) => void;
  onDeleteClick: (id: string) => void;
}

export const IndustryList: React.FC<IndustryListProps> = ({
  industries,
  loading,
  onCreateClick,
  onUploadClick,
  onCrawlClick,
  onEditClick,
  onDeleteClick,
}) => {
  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Registered Industries ({industries.length})</h2>
        <button className="btn btn-primary shadow-glow-primary hover:-translate-y-1 transition-transform" onClick={onCreateClick}>
          <Plus size={16} /> Create Industry
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
          Loading industries...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {industries.map((ind) => {
            const isActive = ind.status === 'active';
            return (
              <div
                key={ind.id}
                className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-5 bg-white/5 border border-white/10 rounded-2xl gap-4 hover:border-accent-cyan/40 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-white truncate">{ind.name}</div>
                    <span className={`badge ${isActive ? 'badge-success' : 'badge-amber'}`}>
                      {isActive ? <CheckCircle2 size={14} /> : <PauseCircle size={14} />}
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm mt-2">
                    Slug: <code className="text-accent-cyan bg-accent-cyan/10 px-1.5 py-0.5 rounded">{ind.slug}</code>
                  </div>
                  <div className="text-slate-500 text-sm mt-1">
                    {ind.description || 'No description provided.'}
                  </div>

                  {ind.knowledgeSources && ind.knowledgeSources.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Knowledge Sources</h4>
                      <div className="flex flex-wrap gap-2">
                        {ind.knowledgeSources.map((ks: any) => (
                          <div key={ks.id} className="text-xs flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded border border-white/5 text-slate-300">
                            {ks.type === 'WEBSITE' ? <LinkIcon size={12} className="text-emerald-400" /> : <Upload size={12} className="text-accent-cyan" />}
                            <span className="truncate max-w-[200px]" title={ks.name}>{ks.name}</span>
                            <span className={`w-2 h-2 rounded-full ${ks.status === 'READY' ? 'bg-emerald-500' : ks.status === 'ERROR' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`} title={`Status: ${ks.status}`}></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-2 shrink-0">
                  <button className="btn btn-secondary btn-sm group-hover:bg-white/5" onClick={() => onUploadClick(ind)} title="Upload Document">
                    <Upload size={14} className="text-accent-cyan" /> Upload
                  </button>
                  <button className="btn btn-secondary btn-sm group-hover:bg-white/5" onClick={() => onCrawlClick(ind)} title="Add Website">
                    <LinkIcon size={14} className="text-emerald-400" /> Website
                  </button>
                  <button className="btn btn-secondary btn-sm group-hover:bg-white/5" onClick={() => onEditClick(ind)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => onDeleteClick(ind.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
          {industries.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-white/5 rounded-xl border border-white/5">
              No industries found. Click "Create Industry" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
