
import React from 'react';
import { useLeadFormState } from './hooks/useLeadFormState';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ContactInfoStep } from './components/ContactInfoStep';
import { BusinessDetailsStep } from './components/BusinessDetailsStep';
import { LeadFormProps } from './types';

export const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const {
    formData,
    setFormData,
    step,
    setStep,
    isSubmitting,
    emailError,
    setEmailError,
    websiteError,
    setWebsiteError,
    handleFirstStepSubmit,
    handleFinalSubmit
  } = useLeadFormState(onSubmit);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="calculator-card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Calculate Your Potential AI Savings
        </h2>
        
        <ProgressIndicator step={step} totalSteps={2} />

        {step === 1 ? (
          <ContactInfoStep
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleFirstStepSubmit}
            isSubmitting={isSubmitting}
            emailError={emailError}
            websiteError={websiteError}
            setEmailError={setEmailError}
            setWebsiteError={setWebsiteError}
          />
        ) : (
          <BusinessDetailsStep
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleFinalSubmit}
            onBack={() => setStep(1)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};
