import React from 'react';

interface AIReadinessScoreProps {
  answeredCount: number;
  totalCount: number;
}

export function AIReadinessScore({ answeredCount, totalCount }: AIReadinessScoreProps) {
  const percentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  
  let statusColor = 'var(--accent-rose)';
  let barColor = 'var(--accent-rose)';
  if (percentage >= 80) {
    statusColor = 'var(--accent-emerald)';
    barColor = 'var(--accent-emerald)';
  } else if (percentage >= 40) {
    statusColor = 'var(--accent-amber)';
    barColor = 'var(--accent-amber)';
  }

  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>AI Readiness Score</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Answer more questions to improve AI understanding</p>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: statusColor }}>
          {percentage}%
        </div>
      </div>
      <div style={{ width: '100%', background: 'rgba(0, 0, 0, 0.05)', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            background: barColor, 
            width: `${percentage}%`, 
            transition: 'width 0.5s ease-in-out',
            borderRadius: '100px'
          }} 
        />
      </div>
      <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
        {answeredCount} of {totalCount} questions answered
      </div>
    </div>
  );
}
