
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { INDUSTRY_OPTIONS } from './constants/industries';
import { validateEmail, validatePhoneFormat, validateWebsite } from './utils/validation';
import type { LeadFormData, LeadFormProps } from './types';
import { ContactInfoStep } from './components/ContactInfoStep';
import { BusinessDetailsStep } from './components/BusinessDetailsStep';
import { ProgressIndicator } from './components/ProgressIndicator';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().refine(validatePhoneFormat, "Please enter a valid phone number"),
  website: z.string().optional(),
  industry: z.string().min(1, "Please select an industry"),
  employeeCount: z
    .number()
    .int()
    .positive("Employee count must be a positive number")
    .or(z.string().regex(/^\d+$/).transform(Number))
});

export const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [websiteError, setWebsiteError] = useState('');
  
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    companyName: '',
    email: '',
    phoneNumber: '',
    website: '',
    industry: '',
    employeeCount: 5
  });
  
  const handleContactInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.companyName || !formData.phoneNumber) {
      return;
    }
    
    const validation = validateEmail(formData.email);
    if (!validation.isValid) {
      setEmailError(validation.errorMessage);
      return;
    }
    
    setStep(2);
  };
  
  const handleBusinessDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.industry) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Call the onSubmit callback with the form data
      onSubmit(formData);
      
      // Reset submitting state
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };
  
  const handleBack = () => {
    setStep(1);
  };
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-center mb-2">Calculate Your Potential AI Savings</h2>
        
        <ProgressIndicator step={step} totalSteps={2} />
        
        {step === 1 ? (
          <ContactInfoStep 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleContactInfoSubmit}
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
            onSubmit={handleBusinessDetailsSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )}
        
        <p className="text-xs text-gray-500 text-center mt-4">
          * Required fields. By submitting this form, you agree to be contacted about our services.
        </p>
      </div>
    </div>
  );
};
