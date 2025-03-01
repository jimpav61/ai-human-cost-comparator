
import React from 'react';
import { ROLE_LABELS } from '@/constants/pricing';
import type { CalculatorInputs } from '@/hooks/useCalculator';

interface JobConfigurationSectionProps {
  role: string;
  numEmployees: number;
  onInputChange: (field: keyof CalculatorInputs, value: any) => void;
}

export const JobConfigurationSection: React.FC<JobConfigurationSectionProps> = ({
  role,
  numEmployees,
  onInputChange
}) => {
  return (
    <>
      {/* Job Role Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Job Role</label>
        <select 
          value={role}
          onChange={(e) => onInputChange('role', e.target.value)}
          className="calculator-input"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Number of Employees */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Employees
        </label>
        <input 
          type="number" 
          min="1"
          value={numEmployees}
          onChange={(e) => onInputChange('numEmployees', parseInt(e.target.value) || 1)}
          className="calculator-input"
        />
        <p className="text-sm text-gray-500 mt-1">
          Based on 8-hour workday, 5 days per week
        </p>
      </div>
    </>
  );
};
