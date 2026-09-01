import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, RefreshCw, Save, X } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  rationale: string;
  suggestedPoints: string[];
}

interface InterviewQuestionsManagerProps {
  tenantId: string;
  businessDescription?: string;
}

export const InterviewQuestionsManager: React.FC<InterviewQuestionsManagerProps> = ({ tenantId, businessDescription }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});

  useEffect(() => {
    if (tenantId) fetchQuestions();
  }, [tenantId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/admin/tenants/${tenantId}/interview-questions`);
      setQuestions(res.data);
    } catch (err: any) {
      console.error('Failed to load questions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await axios.post(`/api/v1/admin/tenants/${tenantId}/interview-questions/generate`, {
        businessDescription
      });
      setQuestions(res.data);
    } catch (err: any) {
      alert(`Generate failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (id: string) => {
    try {
      if (id === 'new') {
        await axios.post(`/api/v1/admin/tenants/${tenantId}/interview-questions`, editForm);
      } else {
        await axios.put(`/api/v1/admin/tenants/${tenantId}/interview-questions/${id}`, editForm);
      }
      setEditingId(null);
      fetchQuestions();
    } catch (err: any) {
      alert(`Save failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      await axios.delete(`/api/v1/admin/tenants/${tenantId}/interview-questions/${id}`);
      fetchQuestions();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditForm(q);
  };

  const addNew = () => {
    setEditingId('new');
    setEditForm({ question: '', rationale: '', suggestedPoints: [] });
  };

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Voice Interview Questions</h3>
        <div className="flex gap-2">
          <button type="button" onClick={handleGenerate} disabled={generating} className="btn btn-secondary btn-sm">
            {generating ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            AI Generate Defaults
          </button>
          <button type="button" onClick={addNew} className="btn btn-primary btn-sm">
            <Plus size={14} /> Add Question
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading questions...</div>
      ) : questions.length === 0 && editingId !== 'new' ? (
        <div className="text-slate-500 text-sm italic">No questions found. Generate defaults or add manually.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {(editingId === 'new' ? [{ id: 'new', question: '', rationale: '', suggestedPoints: [] } as Question, ...questions] : questions).map(q => {
            const isEditing = editingId === q.id;
            
            if (isEditing) {
              return (
                <div key={q.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-3">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Question"
                    value={editForm.question || ''}
                    onChange={e => setEditForm({ ...editForm, question: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Rationale (Why we need it)"
                    value={editForm.rationale || ''}
                    onChange={e => setEditForm({ ...editForm, rationale: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Suggested points (comma-separated)"
                    value={(editForm.suggestedPoints || []).join(', ')}
                    onChange={e => setEditForm({ ...editForm, suggestedPoints: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setEditingId(null)} className="btn btn-secondary btn-sm"><X size={14} /> Cancel</button>
                    <button type="button" onClick={() => handleSave(q.id)} className="btn btn-primary btn-sm"><Save size={14} /> Save</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={q.id} className="bg-white/5 p-4 rounded-lg border border-white/10 flex justify-between items-start group">
                <div>
                  <div className="font-semibold text-white mb-1">{q.question}</div>
                  <div className="text-sm text-slate-400 mb-2">{q.rationale}</div>
                  {q.suggestedPoints && q.suggestedPoints.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {q.suggestedPoints.map((pt, i) => (
                        <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">{pt}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                  <button type="button" onClick={() => startEdit(q)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(q.id)} className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
