import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { Button } from '../ui/Button';

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

  useEffect(() => {
    if (transcript.length > lastTranscriptLength) {
      const newText = transcript.slice(lastTranscriptLength);
      onChange(value + (value && newText ? ' ' : '') + newText);
      setLastTranscriptLength(transcript.length);
    } else if (transcript.length < lastTranscriptLength) {
      setLastTranscriptLength(0);
    }
  }, [transcript, value, onChange, lastTranscriptLength]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <select 
          value={lang} 
          onChange={(e) => setLang(e.target.value)}
          className="input-field"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', background: 'transparent' }}
          disabled={isListening}
        >
          <option value="ar-EG">Arabic (Egypt)</option>
          <option value="en-US">English (US)</option>
        </select>
        
        {isSupported ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleToggleListening}
            style={{ 
              borderRadius: '100px', 
              padding: '6px 16px', 
              fontSize: '13px',
              background: isListening ? 'rgba(244, 63, 94, 0.1)' : 'rgba(34, 211, 238, 0.1)',
              borderColor: isListening ? 'rgba(244, 63, 94, 0.3)' : 'rgba(34, 211, 238, 0.3)',
              color: isListening ? 'var(--accent-rose)' : 'var(--accent-cyan)'
            }}
          >
            {isListening ? (
              <>
                <MicOff size={14} style={{ marginRight: '6px' }} />
                Stop Listening
              </>
            ) : (
              <>
                <Mic size={14} style={{ marginRight: '6px' }} />
                Start Speaking
              </>
            )}
          </Button>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Speech not supported.</span>
        )}
      </div>
      
      <div style={{ position: 'relative' }}>
        <textarea
          dir="auto"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field"
          style={{ minHeight: '160px', padding: '16px', fontSize: '15px', lineHeight: 1.6, resize: 'vertical' }}
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
