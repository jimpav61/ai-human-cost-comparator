
import React from 'react';
import { validateEmail, validateWebsite } from '../utils/validation';
import { LeadFormData } from '../types';

interface ContactInfoStepProps {
  formData: LeadFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeadFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  emailError: string;
  websiteError: string;
  setEmailError: React.Dispatch<React.SetStateAction<string>>;
  setWebsiteError: React.Dispatch<React.SetStateAction<string>>;
}

export const ContactInfoStep: React.FC<ContactInfoStepProps> = ({
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  emailError,
  websiteError,
  setEmailError,
  setWebsiteError
}) => {
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    
    if (email) {
      const validation = validateEmail(email);
      setEmailError(validation.errorMessage);
    } else {
      setEmailError('');
    }
  };

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const website = e.target.value;
    setFormData(prev => ({ ...prev, website }));
    
    if (website) {
      setWebsiteError('');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            id="name"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            id="phoneNumber"
            type="tel"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.phoneNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
          />
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            id="companyName"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.companyName}
            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            Company Website *
          </label>
          <input
            id="website"
            type="text"
            required
            className={`w-full px-3 py-2 border ${websiteError ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            value={formData.website}
            onChange={handleWebsiteChange}
            placeholder="example.com"
          />
          {websiteError && (
            <p className="text-red-500 text-sm mt-1">{websiteError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Enter your company domain
          </p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Business Email *
          </label>
          <input
            id="email"
            type="email"
            required
            className={`w-full px-3 py-2 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            value={formData.email}
            onChange={handleEmailChange}
          />
          {emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Please use your business email address
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
            Processing...
          </>
        ) : "Continue to Business Details"}
      </button>
    </form>
  );
};
