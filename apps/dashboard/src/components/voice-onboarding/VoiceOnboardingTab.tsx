import React, { useState } from 'react';
import { SpeechTextInput } from './SpeechTextInput';
import { QuestionCard } from './QuestionCard';
import { AIReadinessScore } from './AIReadinessScore';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

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
      <div className="max-w-3xl mx-auto py-12 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Welcome to Voice Onboarding</h2>
        <p className="text-gray-300 mb-8 text-lg">
          Train your AI assistant simply by talking. We'll guide you through a series of questions 
          about your business. Just hit the microphone and start speaking.
        </p>
        <button 
          onClick={() => setStep('interview')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
        >
          Start Interview <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-6 text-center">
        <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Training Complete!</h2>
        <p className="text-gray-300 mb-8">
          Thank you for providing this context. Your AI assistant will process this information 
          and become much better at handling your customer inquiries.
        </p>
        <button 
          onClick={() => {
            setStep('interview');
            setCurrentQuestionIndex(0);
          }}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Review Answers
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <AIReadinessScore answeredCount={answeredCount} totalCount={mockQuestions.length} />
      
      <div className="mb-4 flex justify-between items-center text-sm text-gray-400">
        <span>Question {currentQuestionIndex + 1} of {mockQuestions.length}</span>
      </div>

      {currentQuestion && (
        <>
          <QuestionCard 
            question={currentQuestion.question}
            rationale={currentQuestion.rationale}
            suggestedPoints={currentQuestion.suggestedPoints}
          />

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Answer</label>
            <SpeechTextInput 
              value={currentAnswer}
              onChange={(val) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))}
              placeholder="Speak or type your answer here..."
            />
          </div>
        </>
      )}

      <div className="flex justify-between">
        <button 
          onClick={handlePrev}
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button 
          onClick={handleNext}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {currentQuestionIndex === mockQuestions.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
