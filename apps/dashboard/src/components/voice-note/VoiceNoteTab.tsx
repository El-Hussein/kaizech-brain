import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mic, Square, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSpeechToText } from '../../hooks/useSpeechToText';

interface VoiceNoteTabProps {
  apiKey: string;
  onComplete?: () => void;
}

export function VoiceNoteTab({ apiKey, onComplete }: VoiceNoteTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  
  const [transcript, setTranscript] = useState('');
  
  const handleFinalResult = (finalText: string) => {
    const separator = transcript && !transcript.endsWith(' ') ? ' ' : '';
    setTranscript(prev => prev + separator + finalText);
  };

  const {
    isSupported,
    isListening,
    interimResult,
    startListening,
    stopListening
  } = useSpeechToText('ar-EG', handleFinalResult);

  const combinedTranscript = interimResult 
    ? transcript + (transcript && !transcript.endsWith(' ') ? ' ' : '') + interimResult
    : transcript;

  useEffect(() => {
    const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setNoteTitle(`Voice Note - ${dateStr}`);
  }, []);

  const handleSave = async () => {
    if (!combinedTranscript) return;

    try {
      setLoading(true);
      setError(null);

      const blob = new Blob([combinedTranscript], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', blob, `${noteTitle}.txt`);
      formData.append('name', noteTitle);
      formData.append('sourceType', 'document');

      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      await axios.post(`${apiBase}/api/v1/knowledge/upload`, formData, {
        headers: { 
          'x-api-key': apiKey,
          'Content-Type': 'multipart/form-data'
        }
      });

      setTranscript('');
      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save voice note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
          Freestyle Voice Note
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Remembered an important detail? Just tap record and speak. We'll transcribe it and add it directly to your AI's knowledge base.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Note Title
          </label>
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="input-field"
            style={{ width: '100%', padding: '10px' }}
          />
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          padding: '48px 24px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)'
        }}>
          {!isSupported ? (
            <div style={{ color: 'var(--accent-amber)', marginBottom: '16px' }}>
              Speech recognition is not supported in your browser. Please type your note instead.
            </div>
          ) : (
            <>
              <button
                onClick={isListening ? stopListening : startListening}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isListening ? 'var(--accent-rose)' : 'var(--accent-cyan)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isListening ? '0 0 0 8px rgba(244, 63, 94, 0.2)' : '0 4px 12px rgba(34, 211, 238, 0.3)',
                  transition: 'all 0.2s ease',
                  animation: isListening ? 'pulse 2s infinite' : 'none'
                }}
              >
                {isListening ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
              </button>
              
              <div style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500 }}>
                {isListening ? 'Listening... Tap to stop' : 'Tap to start speaking'}
              </div>
            </>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Transcript
          </label>
          <textarea
            value={combinedTranscript}
            readOnly
            className="input-field"
            style={{ width: '100%', minHeight: '150px', padding: '12px', resize: 'vertical' }}
            placeholder="Your spoken words will appear here..."
          />
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-rose)', borderRadius: '8px', color: 'var(--accent-rose)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={handleSave}
            disabled={!combinedTranscript || loading}
            style={{ padding: '12px 24px', fontSize: '15px', borderRadius: '8px' }}
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} /> Saving...</>
            ) : (
              <><Save size={18} style={{ marginRight: '8px' }} /> Save Note to Knowledge Base</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
