import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechToText(lang: string = 'en-US', onFinalResult?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [interimResult, setInterimResult] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const onFinalResultRef = useRef(onFinalResult);

  // Keep callback ref updated without triggering effect dependencies
  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Enabled for real-time feedback
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setInterimResult(interimTranscript);
      
      if (finalTranscript && onFinalResultRef.current) {
        onFinalResultRef.current(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Browsers often stop recognition after a pause even in continuous mode.
      setIsListening(false);
      setInterimResult('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setInterimResult('');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimResult('');
    }
  }, [isListening]);

  return {
    isSupported,
    isListening,
    interimResult,
    startListening,
    stopListening,
  };
}
