
import React from 'react';
import type { CalculatorInputs } from '@/hooks/useCalculator';

interface VoiceConfigSectionProps {
  callVolume: number;
  avgCallDuration: number;
  onInputChange: (field: keyof CalculatorInputs, value: any) => void;
}

export const VoiceConfigSection: React.FC<VoiceConfigSectionProps> = ({
  callVolume,
  avgCallDuration,
  onInputChange
}) => {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monthly Call Volume
        </label>
        <input 
          type="number" 
          min="1"
          value={callVolume}
          onChange={(e) => onInputChange('callVolume', parseInt(e.target.value) || 0)}
          className="calculator-input"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Average Call Duration (minutes)
        </label>
        <input 
          type="number" 
          min="0.5" 
          step="0.5"
          value={avgCallDuration}
          onChange={(e) => onInputChange('avgCallDuration', parseFloat(e.target.value) || 0)}
          className="calculator-input"
        />
      </div>
    </>
  );
};
