
import React from 'react';
import { Button } from '@/components/ui/button';
import { INDUSTRY_OPTIONS } from '../constants/industries';
import { LeadFormData } from '../types';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BusinessDetailsStepProps {
  formData: LeadFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeadFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const BusinessDetailsStep: React.FC<BusinessDetailsStepProps> = ({
  formData,
  setFormData,
  onSubmit,
  onBack,
  isSubmitting
}) => {
  const isMobile = useIsMobile();

  // Function to increment employee count
  const incrementEmployeeCount = () => {
    setFormData(prev => ({ ...prev, employeeCount: (prev.employeeCount || 1) + 1 }));
  };

  // Function to decrement employee count (minimum 1)
  const decrementEmployeeCount = () => {
    setFormData(prev => ({ ...prev, employeeCount: Math.max(1, (prev.employeeCount || 1) - 1) }));
  };

  // Handle direct input change
  const handleEmployeeCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow empty field temporarily when typing
    if (e.target.value === '') {
      setFormData(prev => ({ ...prev, employeeCount: 0 })); // Use 0 temporarily to allow clearing
      return;
    }
    
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setFormData(prev => ({ ...prev, employeeCount: value }));
    }
  };

  // Handle blur to ensure minimum value is 1
  const handleBlur = () => {
    if (formData.employeeCount < 1) {
      setFormData(prev => ({ ...prev, employeeCount: 1 }));
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
          Industry *
        </label>
        <select
          id="industry"
          required
          className="calculator-input w-full px-3 py-2 border border-gray-300 rounded-md"
          value={formData.industry}
          onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
        >
          <option value="" disabled>Select your industry</option>
          {INDUSTRY_OPTIONS.map(industry => (
            <option key={industry} value={industry}>{industry}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-1">
          Number of Employees *
        </label>
        <div className="flex items-center">
          {/* Add decrement button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="px-2 py-0 h-10 border border-gray-300"
            onClick={decrementEmployeeCount}
          >
            <MinusCircle className="h-4 w-4" />
          </Button>
          
          <Input
            id="employeeCount"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            className="calculator-input rounded-none text-center border-x-0 w-full px-3 py-2"
            value={formData.employeeCount === 0 ? '' : formData.employeeCount}
            onChange={handleEmployeeCountChange}
            onBlur={handleBlur}
          />
          
          {/* Add increment button */}
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
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={isSubmitting}
        >
          Back
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-brand-500 hover:bg-brand-600 text-white"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : "Let's Calculate Your Savings"}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        * Required fields. By submitting this form, you agree to be contacted about our services.
      </p>
    </form>
  );
};
