import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechToText } from '../../hooks/useSpeechToText';

interface SpeechTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SpeechTextInput({ value, onChange, placeholder = 'Speak or type here...', className = '' }: SpeechTextInputProps) {
  const [lang, setLang] = useState('ar-EG');
  const { isSupported, isListening, transcript, startListening, stopListening } = useSpeechToText(lang);
  const [lastTranscriptLength, setLastTranscriptLength] = useState(0);
  
  // Auto-scroll to transcript area if it gets very long while listening
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (transcript.length > lastTranscriptLength) {
      const newText = transcript.slice(lastTranscriptLength);
      onChange(value + (value && newText ? ' ' : '') + newText);
      setLastTranscriptLength(transcript.length);
    } else if (transcript.length < lastTranscriptLength) {
      setLastTranscriptLength(0);
    }
  }, [transcript, value, onChange, lastTranscriptLength]);

  // Scroll effect to keep user attention on the new text
  useEffect(() => {
    if (isListening && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [value, isListening]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`relative ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Big Recording Button Area */}
      {isSupported ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0' }}>
          <button
            type="button"
            onClick={handleToggleListening}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isListening ? 'var(--accent-rose)' : 'var(--accent-cyan)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isListening
                ? '0 0 0 12px rgba(244, 63, 94, 0.15), 0 0 0 24px rgba(244, 63, 94, 0.05)'
                : '0 8px 32px rgba(34, 211, 238, 0.3)',
              transform: isListening ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {isListening ? <MicOff size={40} /> : <Mic size={40} />}
          </button>
          
          <div style={{ 
            marginTop: '32px', 
            fontSize: '18px', 
            fontWeight: 700, 
            color: isListening ? 'var(--accent-rose)' : 'var(--accent-cyan)',
            animation: isListening ? 'pulse 2s infinite' : 'none'
          }}>
            {isListening ? 'Listening... tap to stop' : 'Tap to start speaking'}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(244, 63, 94, 0.05)', borderRadius: '12px', color: 'var(--accent-rose)' }}>
          <MicOff size={32} style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600 }}>Speech recognition is not supported in this browser.</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Please type your answer below.</p>
        </div>
      )}

      {/* Transcript and Fallback Input Area */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
            Transcript / Manual Entry
          </label>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', background: 'transparent' }}
            disabled={isListening}
          >
            <option value="ar-EG">Arabic (Egypt)</option>
            <option value="en-US">English (US)</option>
          </select>
        </div>
        
        <textarea
          ref={textareaRef}
          dir="auto"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field"
          style={{ 
            minHeight: '140px', 
            padding: '16px', 
            fontSize: '15px', 
            lineHeight: 1.6, 
            resize: 'vertical',
            borderColor: isListening ? 'var(--accent-cyan)' : 'var(--border-glass)',
            background: isListening ? 'rgba(34, 211, 238, 0.02)' : 'rgba(0, 0, 0, 0.02)'
          }}
        />
        {isListening && (
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--accent-rose)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
          </div>
        )}
      </div>
    </div>
  );
}
