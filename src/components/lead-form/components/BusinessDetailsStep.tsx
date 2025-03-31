
import React from 'react';
import { Button } from '@/components/ui/button';
import { INDUSTRY_OPTIONS } from '../constants/industries';
import { LeadFormData } from '../types';
import { Input } from '@/components/ui/input';

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
        <Input
          id="employeeCount"
          type="number"
          min="1"
          inputMode="numeric"
          pattern="[0-9]*"
          required
          className="calculator-input w-full px-3 py-2 border border-gray-300 rounded-md"
          value={formData.employeeCount}
          onChange={(e) => setFormData(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 1 }))}
        />
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
