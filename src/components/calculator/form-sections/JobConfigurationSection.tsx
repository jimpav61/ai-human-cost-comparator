
import React from 'react';
import { ROLE_LABELS } from '@/constants/pricing';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { MinusCircle, PlusCircle } from 'lucide-react';

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
  const isMobile = useIsMobile();
  
  // Function to increment employee count
  const incrementEmployeeCount = () => {
    onInputChange('numEmployees', (numEmployees || 1) + 1);
  };

  // Function to decrement employee count (minimum 1)
  const decrementEmployeeCount = () => {
    onInputChange('numEmployees', Math.max(1, (numEmployees || 1) - 1));
  };

  // Handle direct input change
  const handleEmployeeCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow empty field temporarily when typing
    if (e.target.value === '') {
      onInputChange('numEmployees', 0); // Use 0 temporarily to allow clearing
      return;
    }
    
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      onInputChange('numEmployees', value);
    }
  };

  // Handle blur to ensure minimum value is 1
  const handleBlur = () => {
    if (numEmployees < 1) {
      onInputChange('numEmployees', 1);
    }
  };

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

      {/* Number of Employees with +/- controls */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Employees
        </label>
        
        <div className="flex items-center">
          {/* Decrement button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="px-2 py-0 h-10 border border-gray-300"
            onClick={decrementEmployeeCount}
          >
            <MinusCircle className="h-4 w-4" />
          </Button>
          
          <input 
            type="text"
            inputMode="numeric" 
            pattern="[0-9]*"
            value={numEmployees === 0 ? '' : numEmployees}
            onChange={handleEmployeeCountChange}
            onBlur={handleBlur}
            className="calculator-input rounded-none text-center border-x-0 flex-1"
          />
          
          {/* Increment button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="px-2 py-0 h-10 border border-gray-300"
            onClick={incrementEmployeeCount}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mt-1">
          Based on 8-hour workday, 5 days per week
        </p>
      </div>
    </>
  );
};
