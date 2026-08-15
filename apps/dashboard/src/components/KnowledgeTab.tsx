import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Upload,
  FileText,
  Globe,
  HelpCircle,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Database,
  Eye,
  X,
  Hash,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/Button';

interface KnowledgeProps {
  apiKey: string;
}

interface Chunk {
  id: string;
  chunkIndex: number;
  content: string;
  metadata: Record<string, any>;
}

interface Source {
  id: string;
  name: string;
  sourceType: string;
  status: string;
  chunkCount: number;
  createdAt?: string;
  url?: string;
  errorMessage?: string;
}

// ── Viewer Modal ─────────────────────────────────────────────────────────────
const ViewerModal: React.FC<{
  source: Source;
  apiKey: string;
  onClose: () => void;
}> = ({ source, apiKey, onClose }) => {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/v1/knowledge/${source.id}/chunks`, {
          headers: { 'x-api-key': apiKey },
        });
        setChunks(res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [source.id, apiKey]);

  const toggleChunk = (idx: number) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const copyChunk = async (chunk: Chunk) => {
    await navigator.clipboard.writeText(chunk.content);
    setCopiedId(chunk.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cleanContent = (text: string) => {
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/(\n|^)\s*---\s*(\n|$)/g, '$1──────────────────────────────────$2')
      .trim();
  };

  const filtered = search.trim()
    ? chunks.filter((c) => c.content.toLowerCase().includes(search.toLowerCase()))
    : chunks;

  const accentColor =
    {
      faq: 'var(--accent-cyan)',
      pdf: 'var(--accent-rose)',
      docx: 'var(--accent-secondary)',
      xlsx: 'var(--accent-emerald)',
      markdown: 'var(--accent-amber)',
      website: 'var(--accent-primary)',
      text: 'var(--text-muted)',
    }[source.sourceType?.toLowerCase()] || 'var(--accent-primary)';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '90vh',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderColor: accentColor,
          boxShadow: `0 0 50px rgba(0, 0, 0, 0.8), 0 0 0 1px ${accentColor}44`,
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Eye size={18} color={accentColor} />
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{source.name}</h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: `${accentColor}22`,
                  color: accentColor,
                  border: `1px solid ${accentColor}44`,
                }}
              >
                {source.sourceType}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {source.chunkCount} vector chunks indexed
              {source.url && (
                <span style={{ marginLeft: '10px', color: 'var(--accent-cyan)' }}>
                  ·{' '}
                  <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                    {source.url}
                  </a>
                </span>
              )}
            </p>
          </div>
          <Button variant="secondary" style={{ padding: '8px 10px' }} onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {/* Search */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-glass)', flexShrink: 0 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search content across all chunks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '13px' }}
          />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading && (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
              <Clock size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <div>Loading chunks...</div>
            </div>
          )}

          {error && (
            <div style={{ padding: '14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '10px', color: 'var(--accent-rose)', fontSize: '14px' }}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
              {search ? 'No chunks match your search.' : 'No chunks found for this source.'}
            </div>
          )}

          {!loading && !error && filtered.map((chunk) => {
            const isExpanded = expandedChunks.has(chunk.chunkIndex);
            const formattedText = cleanContent(chunk.content);
            const preview = formattedText.length > 220 && !isExpanded
              ? formattedText.slice(0, 220) + '…'
              : formattedText;

            return (
              <div
                key={chunk.id}
                style={{
                  flexShrink: 0,
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Chunk Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderBottom: isExpanded ? '1px solid var(--border-glass)' : 'none',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => toggleChunk(chunk.chunkIndex)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        background: `${accentColor}22`,
                        color: accentColor,
                        border: `1px solid ${accentColor}44`,
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <Hash size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                      Chunk #{chunk.chunkIndex + 1}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {chunk.content.length} chars
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Button
                      variant="secondary"
                      style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
                      onClick={(e) => { e.stopPropagation(); copyChunk(chunk); }}
                    >
                      {copiedId === chunk.id ? <Check size={11} /> : <Copy size={11} />}
                      {copiedId === chunk.id ? 'Copied' : 'Copy'}
                    </Button>
                    <span style={{ fontSize: '12px', color: accentColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {isExpanded ? 'Collapse' : 'Expand'}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </div>
                </div>

                {/* Chunk Content */}
                <div style={{ padding: '12px 14px' }}>
                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.65,
                      color: '#f9fafb',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'var(--font-sans)',
                      margin: 0,
                    }}
                    dir="auto"
                  >
                    {preview}
                  </p>
                  {formattedText.length > 220 && (
                    <Button
                      variant="ghost"
                      style={{ marginTop: '8px', color: accentColor, fontSize: '12px', fontWeight: 600, padding: '2px 6px' }}
                      onClick={() => toggleChunk(chunk.chunkIndex)}
                    >
                      {isExpanded ? 'Show less ↑' : 'Show more ↓'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div
            style={{
              padding: '12px 24px',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              Showing {filtered.length} of {chunks.length} chunks
              {search && ` matching "${search}"`}
            </span>
            <Button variant="secondary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

// ── Main KnowledgeTab ─────────────────────────────────────────────────────────
export const KnowledgeTab: React.FC<KnowledgeProps> = ({ apiKey }) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'faq' | 'crawl'>('upload');

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [markAsFaq, setMarkAsFaq] = useState(false);

  const [faqName, setFaqName] = useState('Product FAQ');
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);

  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlName, setCrawlName] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [viewingSource, setViewingSource] = useState<Source | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/v1/knowledge', {
        headers: { 'x-api-key': apiKey },
      });
      const sourceList = Array.isArray(res.data) ? res.data : (res.data?.data && Array.isArray(res.data.data) ? res.data.data : []);
      setSources(sourceList);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not connect to backend API server.');
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (markAsFaq) {
        formData.append('sourceType', 'faq');
      }
      await axios.post('/api/v1/knowledge/upload', formData, {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'multipart/form-data' },
      });
      setUploadFile(null);
      setMarkAsFaq(false);
      fetchSources();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      alert(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploading(true);
      const filteredFaqs = faqs.filter(
        (f) => f.question.trim() !== '' || f.answer.trim() !== '',
      );
      if (filteredFaqs.length === 0) {
        alert('Please enter at least one question or answer.');
        setUploading(false);
        return;
      }
      await axios.post('/api/v1/knowledge/faq', { name: faqName, faqs: filteredFaqs }, { headers: { 'x-api-key': apiKey } });
      setFaqs([{ question: '', answer: '' }]);
      fetchSources();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'FAQ import failed';
      alert(`FAQ import failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploading(true);
      await axios.post('/api/v1/knowledge/crawl', { url: crawlUrl, name: crawlName }, { headers: { 'x-api-key': apiKey } });
      setCrawlUrl('');
      setCrawlName('');
      fetchSources();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Crawl failed';
      alert(`Crawl failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge source?')) return;
    try {
      await axios.delete(`/api/v1/knowledge/${id}`, { headers: { 'x-api-key': apiKey } });
      fetchSources();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const typeColor: Record<string, string> = {
    faq: 'var(--accent-cyan)',
    pdf: 'var(--accent-rose)',
    docx: 'var(--accent-secondary)',
    xlsx: 'var(--accent-emerald)',
    markdown: 'var(--accent-amber)',
    website: 'var(--accent-primary)',
    text: 'var(--text-muted)',
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Knowledge Base (RAG)</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
          Upload documents, import FAQs, or crawl website pages to train your AI Agent.
        </p>
      </div>

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant={activeSubTab === 'upload' ? 'primary' : 'secondary'} onClick={() => setActiveSubTab('upload')}>
          <FileText size={16} /> Document Upload (PDF / DOCX / XLSX / MD)
        </Button>
        <Button variant={activeSubTab === 'faq' ? 'primary' : 'secondary'} onClick={() => setActiveSubTab('faq')}>
          <HelpCircle size={16} /> FAQ Import
        </Button>
        <Button variant={activeSubTab === 'crawl' ? 'primary' : 'secondary'} onClick={() => setActiveSubTab('crawl')}>
          <Globe size={16} /> Website Crawler
        </Button>
      </div>

      {/* Action Form */}
      <div className="glass-card" style={{ padding: '24px' }}>
        {activeSubTab === 'upload' && (
          <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div 
              style={{
                border: '2px dashed var(--border-glass)',
                borderRadius: '16px',
                padding: '48px 20px',
                textAlign: 'center',
                background: uploadFile ? 'rgba(16, 185, 129, 0.05)' : 'rgba(248, 250, 252, 0.5)',
                borderColor: uploadFile ? 'var(--accent-emerald)' : 'var(--border-glass)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease',
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'rgba(29, 61, 132, 0.05)'; }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = uploadFile ? 'var(--accent-emerald)' : 'var(--border-glass)'; e.currentTarget.style.background = uploadFile ? 'rgba(16, 185, 129, 0.05)' : 'rgba(248, 250, 252, 0.5)'; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = uploadFile ? 'var(--accent-emerald)' : 'var(--border-glass)';
                e.currentTarget.style.background = uploadFile ? 'rgba(16, 185, 129, 0.05)' : 'rgba(248, 250, 252, 0.5)';
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setUploadFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <FileText size={36} color={uploadFile ? 'var(--accent-emerald)' : 'var(--text-muted)'} />
              <div>
                <p style={{ fontWeight: 700, fontSize: '16px', color: uploadFile ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
                  {uploadFile ? uploadFile.name : 'Click to upload or drag and drop a file'}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Supported formats: PDF, DOCX, XLSX, Markdown .md
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.xlsx,.md,.markdown"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: markAsFaq ? 'rgba(34, 211, 238, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: markAsFaq ? '1px solid rgba(34, 211, 238, 0.3)' : '1px solid var(--border-glass)',
                transition: 'all 0.2s ease',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  border: markAsFaq ? '2px solid var(--accent-cyan)' : '2px solid var(--text-muted)',
                  background: markAsFaq ? 'var(--accent-cyan)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {markAsFaq && <Check size={12} color="#000" strokeWidth={3} />}
              </div>
              <input
                type="checkbox"
                checked={markAsFaq}
                onChange={(e) => setMarkAsFaq(e.target.checked)}
                style={{ display: 'none' }}
              />
              <div>
                <div style={{ fontWeight: 600, color: markAsFaq ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                  <HelpCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  Mark as FAQ Document
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Tags this file as FAQ knowledge for higher-priority matching in conversations.
                </div>
              </div>
            </label>
            <Button type="submit" variant="primary" loading={uploading} loadingText="Processing & Embedding..." disabled={!uploadFile} style={{ alignSelf: 'flex-start' }}>
              <Upload size={16} /> Upload & Train RAG
            </Button>
          </form>
        )}

        {activeSubTab === 'faq' && (
          <form onSubmit={handleFaqSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Knowledge Title</label>
              <input type="text" className="input-field" value={faqName} onChange={(e) => setFaqName(e.target.value)} />
            </div>
            {faqs.map((faq, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                <input
                  type="text"
                  placeholder="Question"
                  className="input-field"
                  value={faq.question}
                  dir="auto"
                  onChange={(e) => {
                    const newFaqs = [...faqs];
                    newFaqs[index].question = e.target.value;
                    setFaqs(newFaqs);
                  }}
                />
                <textarea
                  placeholder="Answer"
                  className="input-field"
                  value={faq.answer}
                  dir="auto"
                  onChange={(e) => {
                    const newFaqs = [...faqs];
                    newFaqs[index].answer = e.target.value;
                    setFaqs(newFaqs);
                  }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button type="button" variant="secondary" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}>
                + Add FAQ Pair
              </Button>
              <Button type="submit" variant="primary" loading={uploading} loadingText="Importing...">
                Import FAQs
              </Button>
            </div>
          </form>
        )}

        {activeSubTab === 'crawl' && (
          <form onSubmit={handleCrawlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Target Website URL</label>
              <input type="url" placeholder="https://example.com/help" className="input-field" value={crawlUrl} onChange={(e) => setCrawlUrl(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Name (Optional)</label>
              <input type="text" placeholder="e.g. Help Center Page" className="input-field" value={crawlName} onChange={(e) => setCrawlName(e.target.value)} />
            </div>
            <Button type="submit" variant="primary" loading={uploading} loadingText="Crawling & Embedding..." disabled={!crawlUrl} style={{ alignSelf: 'flex-start' }}>
              <Globe size={16} /> Crawl Page
            </Button>
          </form>
        )}
      </div>

      {/* Indexed Sources Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--accent-primary)" /> Indexed Knowledge Sources ({sources.length})
          </h3>
          <Button variant="secondary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={fetchSources}>
            ↻ Refresh
          </Button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            API Connection Warning: {error}
          </div>
        )}

        {loading && (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading sources...</p>
        )}

        {!loading && sources.length === 0 && !error && (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No knowledge sources indexed yet. Upload a document or crawl a URL above.</p>
        )}

        {!loading && sources.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sources.map((src) => {
              const color = typeColor[src.sourceType?.toLowerCase()] || 'var(--accent-primary)';
              return (
                <div
                  key={src.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}44`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-glass)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Type badge */}
                    <span
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: `${color}18`,
                        border: `1px solid ${color}33`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={16} color={color} />
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{src.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px', display: 'flex', gap: '10px' }}>
                        <span style={{ textTransform: 'uppercase', fontWeight: 600, color }}>{src.sourceType}</span>
                        <span>·</span>
                        <span>{src.chunkCount} chunks</span>
                        {src.createdAt && (
                          <>
                            <span>·</span>
                            <span>{new Date(src.createdAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      {src.status === 'failed' && src.errorMessage && (
                        <div style={{ color: 'var(--accent-rose)', fontSize: '11px', marginTop: '4px', maxWidth: '400px' }}>
                          Reason: {src.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {src.status === 'completed' && <span className="badge badge-success"><CheckCircle2 size={12} /> Indexed</span>}
                    {src.status === 'processing' && <span className="badge badge-warning"><Clock size={12} /> Processing</span>}
                    {src.status === 'failed' && <span className="badge" style={{ background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.3)' }}><AlertTriangle size={12} /> Failed</span>}

                    {/* View Button */}
                    {src.status === 'completed' && (
                      <Button
                        variant="secondary"
                        style={{ padding: '6px 12px', fontSize: '13px', gap: '6px', color }}
                        onClick={() => setViewingSource(src)}
                        title="View content"
                      >
                        <Eye size={14} /> View
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      style={{ padding: '6px 10px' }}
                      onClick={() => handleDelete(src.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Viewer Modal */}
      {viewingSource && (
        <ViewerModal
          source={viewingSource}
          apiKey={apiKey}
          onClose={() => setViewingSource(null)}
        />
      )}
    </div>
  );
};
