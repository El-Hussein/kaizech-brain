import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, 
  XCircle, 
  BrainCircuit, 
  AlertCircle, 
  RotateCcw,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from './ui/Button';

interface LearningRule {
  id: string;
  sourceConversationId: string;
  category: string;
  suggestedRule: string;
  confidenceScore: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  metadata?: { reasoning?: string; transcript?: string; [key: string]: unknown };
  createdAt: string;
}

export const LearningsTab: React.FC = () => {
  const [learnings, setLearnings] = useState<LearningRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [editedRules, setEditedRules] = useState<Record<string, string>>({});
  const [expandedContexts, setExpandedContexts] = useState<Record<string, boolean>>({});
  const [extracting, setExtracting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Undo snackbar state
  const [undoSnack, setUndoSnack] = useState<{ id: string; timeout: ReturnType<typeof setTimeout> } | null>(null);

  // Cleanup timeout on unmount to execute immediately
  useEffect(() => {
    return () => {
      if (undoSnack) {
        clearTimeout(undoSnack.timeout);
        axios.post(`/api/v1/learnings/${undoSnack.id}/reject`).catch(() => {});
      }
    };
  }, [undoSnack]);

  const fetchLearnings = async (p = page) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/v1/learnings?page=${p}&limit=${limit}`);
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        setLearnings(res.data.data);
        setTotal(res.data.total);
      } else if (Array.isArray(res.data)) {
        setLearnings(res.data);
        setTotal(res.data.length);
      } else {
        setLearnings([]);
        setTotal(0);
      }
    } catch (err) {
      // Handled by global interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearnings(page);
  }, [page]);

  const handleApprove = async (id: string, isEdited: boolean) => {
    try {
      const modifiedRule = editedRules[id];
      await axios.post(`/api/v1/learnings/${id}/approve`, { modifiedRule });
      // Update local state to APPROVED
      setLearnings(prev => prev.map(l => l.id === id ? { ...l, status: 'APPROVED', suggestedRule: modifiedRule || l.suggestedRule } : l));
    } catch (err) {
      // Handled by global interceptor
    }
  };

  const handleTriggerExtraction = async () => {
    try {
      setExtracting(true);
      await axios.post('/api/v1/learnings/trigger-extraction');
      // Briefly show extracting state, then re-fetch
      setTimeout(() => {
        fetchLearnings();
        setExtracting(false);
      }, 2000);
    } catch (err) {
      // Handled by global interceptor
      setExtracting(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      // Optimistic UI for reject + Undo
      setLearnings(prev => prev.map(l => l.id === id ? { ...l, status: 'REJECTED' } : l));
      
      const timeout = setTimeout(async () => {
        // Execute API call after 5s if not undone
        await axios.post(`/api/v1/learnings/${id}/reject`);
        setUndoSnack(null);
      }, 5000);

      setUndoSnack({ id, timeout });
    } catch (err) {
      // Handled by global interceptor
    }
  };

  const handleUndoReject = () => {
    if (undoSnack) {
      clearTimeout(undoSnack.timeout);
      setLearnings(prev => prev.map(l => l.id === undoSnack.id ? { ...l, status: 'PENDING' } : l));
      setUndoSnack(null);
    }
  };

  const toggleContext = (id: string) => {
    setExpandedContexts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getConfidencePill = (score: number) => {
    if (score >= 85) return { color: 'var(--accent-emerald)', shadow: 'rgba(16, 185, 129, 0.4)' };
    if (score >= 70) return { color: 'var(--accent-amber)', shadow: 'rgba(245, 158, 11, 0.4)' };
    return { color: 'var(--accent-rose)', shadow: 'rgba(244, 63, 94, 0.4)' };
  };

  const displayedLearnings = learnings.filter(l => l.status === subTab);

  return (
    <div style={{ padding: '24px', fontFamily: '"Plus Jakarta Sans", sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <BrainCircuit size={32} color="var(--accent-cyan)" />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>AI Memory & Rules</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '14px' }}>
            Review, edit, and approve autonomous self-correction rules generated from user feedback.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', alignItems: 'center' }}>
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            style={{
              background: subTab === tab ? 'var(--bg-glass)' : 'transparent',
              border: subTab === tab ? '1px solid var(--border-glass)' : '1px solid transparent',
              color: subTab === tab ? 'var(--text-main)' : 'var(--text-muted)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {tab === 'PENDING' ? 'Pending Review' : tab === 'APPROVED' ? 'Active Rules' : 'Archived'}
            {tab === 'PENDING' && (
              <span style={{
                background: 'var(--accent-rose)',
                color: 'white',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>
                {learnings.filter(l => l.status === 'PENDING').length}
              </span>
            )}
          </button>
        ))}

        <div style={{ marginLeft: 'auto' }}>
          <Button 
            variant="secondary" 
            onClick={handleTriggerExtraction} 
            disabled={extracting}
          >
            {extracting ? (
              <><RotateCcw size={16} className="animate-spin" /> Extracting...</>
            ) : (
              <><BrainCircuit size={16} /> Force AI Learning Now</>
            )}
          </Button>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading rules...</div>
        ) : displayedLearnings.length === 0 ? (
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            No {subTab.toLowerCase()} rules found.
          </div>
        ) : (
          displayedLearnings.map(learning => {
            const isEdited = editedRules[learning.id] !== undefined && editedRules[learning.id] !== learning.suggestedRule;
            const currentRuleText = editedRules[learning.id] ?? learning.suggestedRule;
            const pillStyle = getConfidencePill(learning.confidenceScore);

            return (
              <div key={learning.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontFamily: '"JetBrains Mono", monospace', 
                      color: pillStyle.color,
                      border: `1px solid ${pillStyle.color}`,
                      boxShadow: `0 0 10px ${pillStyle.shadow}`,
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontWeight: 700
                    }}>
                      Confidence: {learning.confidenceScore}%
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: '"JetBrains Mono", monospace' }} title="Learning ID">
                      ID: {learning.id.split('-')[0]}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: '"JetBrains Mono", monospace' }} title={`Conversation ID: ${learning.sourceConversationId}`}>
                      Conv: {learning.sourceConversationId ? learning.sourceConversationId.split('-')[0] : 'N/A'}
                    </span>
                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                      {learning.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(learning.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Origin Context */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button 
                    onClick={() => toggleContext(learning.id)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <MessageSquare size={14} />
                    View Triggering Context Snippet
                    {expandedContexts[learning.id] ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
                  </button>
                  {expandedContexts[learning.id] && (
                    <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: '#e5e7eb', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {learning.metadata?.transcript ? (
                        <>
                          <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Conversation Snippet:</div>
                          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: '"JetBrains Mono", monospace', margin: 0, padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '12px' }}>
                            {learning.metadata.transcript}
                          </pre>
                          <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginTop: '8px' }}>AI Reasoning:</div>
                          <div style={{ fontStyle: 'italic' }}>
                            "{learning.metadata?.reasoning}"
                          </div>
                        </>
                      ) : (
                        <div style={{ fontStyle: 'italic' }}>"{learning.metadata?.reasoning || 'No reasoning provided by AI.'}"</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Rule Edit Area */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Proposed Rule
                  </div>
                  <textarea
                    value={currentRuleText}
                    onChange={(e) => setEditedRules({ ...editedRules, [learning.id]: e.target.value })}
                    disabled={subTab !== 'PENDING'}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      color: 'var(--text-main)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px',
                      fontFamily: '"JetBrains Mono", monospace',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Actions */}
                {subTab === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <Button variant="secondary" onClick={() => handleReject(learning.id)}>
                      <XCircle size={16} color="var(--accent-rose)" /> Reject & Delete
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => handleApprove(learning.id, isEdited)}
                      style={isEdited ? { background: 'var(--accent-amber)', color: '#000' } : {}}
                    >
                      <CheckCircle2 size={16} /> 
                      {isEdited ? 'Save & Approve Custom Rule' : 'Approve Rule'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination UI */}
      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
          <Button 
            variant="secondary" 
            disabled={page === 1 || loading}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <Button 
            variant="secondary" 
            disabled={page >= Math.ceil(total / limit) || loading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Undo Snackbar */}
      {undoSnack && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-glass)',
          padding: '12px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 9999
        }}>
          <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>Rule marked for rejection.</span>
          <button 
            onClick={handleUndoReject}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-emerald)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} /> UNDO
          </button>
        </div>
      )}
    </div>
  );
};
