import React, { useState } from 'react';
import { SpeechTextInput } from './SpeechTextInput';
import { QuestionCard } from './QuestionCard';
import { AIReadinessScore } from './AIReadinessScore';
import { CheckCircle2, ChevronRight, ChevronLeft, Mic } from 'lucide-react';
import { Button } from '../ui/Button';

const mockQuestions = [
  {
    id: '1',
    question: 'What are the main products or services you offer?',
    rationale: 'This helps the AI understand what you are selling so it can accurately answer customer inquiries.',
    suggestedPoints: ['Core product lines', 'Key services', 'Target audience']
  },
  {
    id: '2',
    question: 'What are your unique selling points (USPs)?',
    rationale: 'Helps the AI differentiate you from competitors when talking to customers.',
    suggestedPoints: ['Quality', 'Price', 'Speed', 'Customer service']
  },
  {
    id: '3',
    question: 'What are the most common questions customers ask you?',
    rationale: 'Pre-training the AI on FAQs ensures it can handle the bulk of support requests instantly.',
    suggestedPoints: ['Shipping times', 'Return policy', 'Business hours']
  }
];

export function VoiceOnboardingTab() {
  const [step, setStep] = useState<'intro' | 'interview' | 'complete'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleNext = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStep('complete');
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setStep('intro');
    }
  };

  const currentQuestion = mockQuestions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion?.id] || '';
  const answeredCount = Object.values(answers).filter(a => a.trim().length > 10).length;

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
          Train your AI assistant simply by talking. We'll guide you through a series of personalized questions about your business. Just hit the microphone and start speaking.
        </p>
        <Button 
          variant="primary" 
          onClick={() => setStep('interview')} 
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
          Thank you for providing this context. Your AI assistant will process this information and become much better at handling your customer inquiries.
        </p>
        <Button 
          variant="secondary" 
          onClick={() => {
            setStep('interview');
            setCurrentQuestionIndex(0);
          }}
          style={{ fontSize: '14px', padding: '10px 24px', borderRadius: '100px', margin: '0 auto' }}
        >
          Review Answers
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <AIReadinessScore answeredCount={answeredCount} totalCount={mockQuestions.length} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
        <span>Question {currentQuestionIndex + 1} of {mockQuestions.length}</span>
      </div>

      {currentQuestion && (
        <>
          <QuestionCard 
            question={currentQuestion.question}
            rationale={currentQuestion.rationale}
            suggestedPoints={currentQuestion.suggestedPoints}
          />

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              Your Answer
            </label>
            <SpeechTextInput 
              value={currentAnswer}
              onChange={(val) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))}
              placeholder="Speak or type your answer here..."
            />
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
        <Button 
          variant="secondary" 
          onClick={handlePrev}
          style={{ padding: '10px 20px', borderRadius: '100px' }}
        >
          <ChevronLeft size={16} style={{ marginRight: '6px' }} /> Back
        </Button>
        <Button 
          variant="primary" 
          onClick={handleNext}
          style={{ padding: '10px 24px', borderRadius: '100px' }}
        >
          {currentQuestionIndex === mockQuestions.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={16} style={{ marginLeft: '6px' }} />
        </Button>
      </div>
    </div>
  );
}
