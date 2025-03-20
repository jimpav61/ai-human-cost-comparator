
import React from 'react';

interface ProgressIndicatorProps {
  step: number;
  totalSteps: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ step, totalSteps }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className={`text-sm font-medium ${step === 1 ? 'text-red-500' : 'text-gray-500'}`}>
          Contact Information
        </span>
        <span className={`text-sm font-medium ${step === 2 ? 'text-red-500' : 'text-gray-500'}`}>
          Business Details
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-red-500 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${(step / totalSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};
