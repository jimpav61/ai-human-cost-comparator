
import React from 'react';
import type { CalculatorInputs } from '@/hooks/useCalculator';

interface ChatConfigSectionProps {
  chatVolume: number;
  onInputChange: (field: keyof CalculatorInputs, value: any) => void;
}

export const ChatConfigSection: React.FC<ChatConfigSectionProps> = ({
  chatVolume,
  onInputChange
}) => {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monthly Chat Volume
        </label>
        <input 
          type="number" 
          min="1"
          value={chatVolume}
          onChange={(e) => onInputChange('chatVolume', parseInt(e.target.value) || 0)}
          className="calculator-input"
        />
      </div>
    </>
  );
};
