import React from 'react';
import { HelpCircle } from 'lucide-react';

interface QuestionCardProps {
  question: string;
  rationale: string;
  suggestedPoints: string[];
}

export function QuestionCard({ question, rationale, suggestedPoints }: QuestionCardProps) {
  return (
    <div className="glass-card p-6 mb-6">
      <h3 className="text-xl font-semibold text-white mb-3" dir="auto">{question}</h3>
      
      <div className="flex items-start gap-2 text-blue-400 mb-4 bg-blue-500/10 p-3 rounded-lg">
        <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm" dir="auto">{rationale}</p>
      </div>

      {suggestedPoints && suggestedPoints.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Suggested points to cover:</h4>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1" dir="auto">
            {suggestedPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
