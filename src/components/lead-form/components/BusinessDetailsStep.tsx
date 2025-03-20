
import React from 'react';
import { INDUSTRY_OPTIONS } from '../constants/industries';
import { LeadFormData } from '../types';

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
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
        <input
          id="employeeCount"
          type="number"
          min="1"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={formData.employeeCount}
          onChange={(e) => setFormData(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 1 }))}
        />
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 bg-white text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-all duration-200"
          disabled={isSubmitting}
        >
          Back
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
              Processing...
            </>
          ) : "Calculate My Savings"}
        </button>
      </div>
    </form>
  );
};
