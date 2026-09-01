import React, { useState, useEffect } from 'react';
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
      <div className="flex justify-between items-center mb-2">
        <select 
          value={lang} 
          onChange={(e) => setLang(e.target.value)}
          className="bg-gray-800 text-white text-sm rounded-md px-2 py-1 border border-gray-700"
          disabled={isListening}
        >
          <option value="ar-EG">Arabic (Egypt)</option>
          <option value="en-US">English (US)</option>
        </select>
        
        {isSupported ? (
          <button
            type="button"
            onClick={handleToggleListening}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isListening ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Speak
              </>
            )}
          </button>
        ) : (
          <span className="text-xs text-gray-500">Speech not supported.</span>
        )}
      </div>
      
      <textarea
        dir="auto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[120px] bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
      />
      {isListening && (
        <div className="absolute bottom-4 right-4 flex gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
        </div>
      )}
    </div>
  );
}
