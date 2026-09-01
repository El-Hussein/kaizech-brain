import React from 'react';

interface AIReadinessScoreProps {
  answeredCount: number;
  totalCount: number;
}

export function AIReadinessScore({ answeredCount, totalCount }: AIReadinessScoreProps) {
  const percentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  
  let statusColor = 'text-red-400';
  let barColor = 'bg-red-500';
  if (percentage >= 80) {
    statusColor = 'text-green-400';
    barColor = 'bg-green-500';
  } else if (percentage >= 40) {
    statusColor = 'text-yellow-400';
    barColor = 'bg-yellow-500';
  }

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h4 className="text-sm font-medium text-gray-300">AI Readiness Score</h4>
          <p className="text-xs text-gray-500 mt-1">Answer more questions to improve AI understanding</p>
        </div>
        <div className={`text-2xl font-bold ${statusColor}`}>
          {percentage}%
        </div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div 
          className={`${barColor} h-2 rounded-full transition-all duration-500 ease-in-out`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-right text-xs text-gray-400">
        {answeredCount} of {totalCount} questions answered
      </div>
    </div>
  );
}
