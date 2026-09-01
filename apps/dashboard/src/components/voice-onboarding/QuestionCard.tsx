import React from 'react';
import { HelpCircle } from 'lucide-react';

interface QuestionCardProps {
  question: string;
  rationale: string;
  suggestedPoints: string[];
}

export function QuestionCard({ question, rationale, suggestedPoints }: QuestionCardProps) {
  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }} dir="auto">
        {question}
      </h3>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '12px', 
        background: 'rgba(34, 211, 238, 0.08)', 
        padding: '16px', 
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid rgba(34, 211, 238, 0.2)'
      }}>
        <HelpCircle size={20} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '14px', color: 'var(--text-main)', margin: 0, lineHeight: 1.6 }} dir="auto">
          {rationale}
        </p>
      </div>

      {suggestedPoints && suggestedPoints.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Suggested points to cover:
          </h4>
          <ul style={{ 
            listStyleType: 'disc', 
            listStylePosition: 'inside', 
            fontSize: '14px', 
            color: 'var(--text-main)', 
            lineHeight: 1.8,
            margin: 0,
            padding: 0
          }} dir="auto">
            {suggestedPoints.map((point, index) => (
              <li key={index} style={{ color: 'var(--text-main)' }}>{point}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
