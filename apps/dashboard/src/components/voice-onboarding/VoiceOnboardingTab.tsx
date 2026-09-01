import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { SpeechTextInput } from './SpeechTextInput';
import { QuestionCard } from './QuestionCard';
import { CheckCircle2, ChevronRight, Play, AlertCircle, RefreshCw, Loader2, Mic } from 'lucide-react';
import { Button } from '../ui/Button';

interface VoiceOnboardingTabProps {
  apiKey: string;
  onComplete?: () => void;
}

interface Question {
  id: string;
  questionText: string;
  whyWeNeedIt: string;
  suggestedPoints: string[];
}

interface Evaluation {
  completenessScore: number;
  evaluationFeedback: string;
  followUpQuestions: string[];
}

export function VoiceOnboardingTab({ apiKey, onComplete }: VoiceOnboardingTabProps) {
  const [step, setStep] = useState<'intro' | 'interview' | 'evaluating' | 'feedback' | 'complete'>('intro');
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = (import.meta as any).env?.VITE_API_URL || '';
  const api = axios.create({
    baseURL: `${apiBase}/api/v1/voice-onboarding`,
    headers: { 'x-api-key': apiKey }
  });

  const startSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/sessions');
      setSessionId(res.data.id);
      await fetchNextQuestion(res.data.id);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextQuestion = async (sId: string = sessionId!) => {
    try {
      setLoading(true);
      const res = await api.get(`/sessions/${sId}/next-question`);
      if (!res.data) {
        await finishSession(sId);
      } else {
        setCurrentQuestion(res.data.question);
        setAnsweredCount(res.data.currentNumber - 1);
        setTotalCount(res.data.totalCount);
        setCurrentAnswer('');
        setStep('interview');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim() || !currentQuestion || !sessionId) return;
    try {
      setStep('evaluating');
      setError(null);
      const res = await api.post(`/sessions/${sessionId}/answer`, {
        questionId: currentQuestion.id,
        answerText: currentAnswer,
        inputMethod: 'mixed'
      });
      setEvaluation({
        completenessScore: res.data.completenessScore,
        evaluationFeedback: res.data.evaluationFeedback,
        followUpQuestions: res.data.followUpQuestions || []
      });
      setAnsweredCount(prev => prev + 1);
      setStep('feedback');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to evaluate answer');
      setStep('interview'); // go back so they can try again
    }
  };

  const finishSession = async (sId: string = sessionId!) => {
    try {
      setStep('complete');
      setLoading(true);
      await api.post(`/sessions/${sId}/complete`);
      if (onComplete) onComplete();
    } catch (err: any) {
      console.error('Failed to complete session:', err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'intro') {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(34, 211, 238, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          border: '1px solid rgba(34, 211, 238, 0.3)'
        }}>
          <Mic size={32} color="var(--accent-cyan)" />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
          Welcome to Voice Onboarding
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
          Train your AI assistant simply by talking. We'll guide you through a series of personalized questions about your business and give you real-time feedback on your answers.
        </p>
        
        {error && <div style={{ color: 'var(--accent-rose)', marginBottom: '16px' }}>{error}</div>}
        
        <Button 
          variant="primary" 
          onClick={startSession} 
          loading={loading}
          style={{ fontSize: '16px', padding: '12px 32px', borderRadius: '100px', margin: '0 auto' }}
        >
          Start Interview <ChevronRight size={18} style={{ marginLeft: '6px' }} />
        </Button>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <CheckCircle2 size={32} color="var(--accent-emerald)" />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
          Training Complete!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
          Thank you for providing this context. Your AI assistant has processed this information and is now much better equipped to handle your customer inquiries.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
        <span>Questions Answered: {answeredCount} of {totalCount}</span>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: 'var(--accent-rose)', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {(step === 'interview' || step === 'evaluating') && currentQuestion && (
        <>
          <QuestionCard 
            question={currentQuestion.questionText}
            rationale={currentQuestion.whyWeNeedIt}
            suggestedPoints={currentQuestion.suggestedPoints}
          />

          <div style={{ marginBottom: '32px', position: 'relative' }}>
            <SpeechTextInput 
              value={currentAnswer}
              onChange={setCurrentAnswer}
              placeholder="Speak or type your answer here..."
            />
            {step === 'evaluating' && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: '16px', zIndex: 10
              }}>
                <Loader2 size={48} color="var(--accent-primary)" className="animate-spin" style={{ marginBottom: '16px' }} />
                <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>AI is evaluating your response...</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button 
              variant="primary" 
              onClick={submitAnswer}
              disabled={currentAnswer.trim().length < 10 || step === 'evaluating'}
              style={{ padding: '12px 32px', borderRadius: '100px', fontSize: '15px' }}
            >
              Evaluate Answer <Play size={16} style={{ marginLeft: '8px' }} />
            </Button>
          </div>
        </>
      )}

      {step === 'feedback' && evaluation && (
        <div className="glass-card animate-fade-in" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '24px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
              background: evaluation.completenessScore >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `2px solid ${evaluation.completenessScore >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: evaluation.completenessScore >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                {evaluation.completenessScore}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</span>
            </div>
            
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                {evaluation.completenessScore >= 80 ? 'Great response!' : 'Could use a bit more detail'}
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }} dir="auto">
                {evaluation.evaluationFeedback}
              </p>
            </div>
          </div>

          {evaluation.followUpQuestions && evaluation.followUpQuestions.length > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} color="var(--accent-primary)" />
                AI Suggested Follow-ups
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.7 }} dir="auto">
                {evaluation.followUpQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
            <Button 
              variant="secondary" 
              onClick={() => {
                // Return to interview state to add more context to the same question
                setCurrentAnswer(prev => prev + '\n\n'); 
                setStep('interview');
              }}
              style={{ padding: '10px 24px', borderRadius: '100px' }}
            >
              <RefreshCw size={16} style={{ marginRight: '8px' }} /> Add more context
            </Button>
            <Button 
              variant="primary" 
              onClick={() => fetchNextQuestion(sessionId!)}
              loading={loading}
              style={{ padding: '10px 32px', borderRadius: '100px' }}
            >
              Continue <ChevronRight size={16} style={{ marginLeft: '8px' }} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
