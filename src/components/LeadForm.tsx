
import React, { useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';

interface LeadFormProps {
  onSubmit: (data: LeadFormData) => void;
}

export interface LeadFormData {
  name: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  website: string;
  industry: string;
  employeeCount: number;
}

// Industry options for dropdown
const INDUSTRY_OPTIONS = [
  "Agriculture",
  "Automotive",
  "Banking & Finance",
  "Construction",
  "Consulting",
  "Education",
  "Entertainment",
  "Food & Beverage",
  "Government",
  "Healthcare",
  "Hospitality",
  "Information Technology",
  "Insurance",
  "Legal Services",
  "Manufacturing",
  "Marketing & Advertising",
  "Media & Publishing",
  "Mining & Metals",
  "Non-Profit",
  "Oil & Gas",
  "Pharmaceuticals",
  "Real Estate",
  "Retail",
  "Telecommunications",
  "Transportation & Logistics",
  "Travel & Tourism",
  "Utilities",
  "Wholesale Distribution",
  "Other"
];

// Free email providers that should be rejected
const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
  "live.com",
  "inbox.com",
  "gmx.com",
  "mailinator.com",
  "msn.com"
];

// Function to validate business email
const isBusinessEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.includes(domain);
};

export const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    companyName: '',
    email: '',
    phoneNumber: '',
    website: '',
    industry: '',
    employeeCount: 1
  });
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    if (!isBusinessEmail(email)) {
      setEmailError('Please use a business email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    
    if (email) {
      validateEmail(email);
    } else {
      setEmailError('');
    }
  };

  const handleFirstStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.companyName || !formData.phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to continue.",
        variant: "destructive",
      });
      return;
    }

    // Validate email before submission
    if (!validateEmail(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please provide a valid business email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save the first step data to the database immediately
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          name: formData.name,
          company_name: formData.companyName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          website: formData.website || null,
          industry: "Not yet provided", // Placeholder until step 2
          employee_count: 0, // Placeholder until step 2
          calculator_inputs: {},
          calculator_results: {},
          proposal_sent: false,
          form_completed: false
        }])
        .select('id')
        .single();

      if (error) throw error;

      setLeadId(data.id);
      setStep(2);
      
      toast({
        title: "Information Saved!",
        description: "Please complete the remaining details to continue to the calculator.",
      });

    } catch (error: any) {
      console.error('Error submitting lead:', error);
      toast({
        title: "Submission Error",
        description: "There was an error saving your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.industry || !formData.employeeCount) {
      toast({
        title: "Missing Information",
        description: "Please select an industry and specify employee count.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the existing record with step 2 data
      if (leadId) {
        const { error } = await supabase
          .from('leads')
          .update({
            industry: formData.industry,
            employee_count: formData.employeeCount,
            form_completed: true
          })
          .eq('id', leadId);

        if (error) throw error;
      } else {
        // Fallback in case leadId is not available (shouldn't happen in normal flow)
        const { error } = await supabase
          .from('leads')
          .insert([{
            name: formData.name,
            company_name: formData.companyName,
            email: formData.email,
            phone_number: formData.phoneNumber,
            website: formData.website || null,
            industry: formData.industry,
            employee_count: formData.employeeCount,
            calculator_inputs: {},
            calculator_results: {},
            proposal_sent: false,
            form_completed: true
          }]);

        if (error) throw error;
      }

      // Call the onSubmit prop with form data
      onSubmit(formData);
      
      toast({
        title: "Success!",
        description: "Your information has been submitted successfully.",
      });

    } catch (error: any) {
      console.error('Error submitting lead:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="calculator-card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Calculate Your Potential AI Savings
        </h2>
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className={`text-sm font-medium ${step === 1 ? 'text-brand-600' : 'text-gray-500'}`}>Contact Information</span>
            <span className={`text-sm font-medium ${step === 2 ? 'text-brand-600' : 'text-gray-500'}`}>Business Details</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-brand-500 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: step === 1 ? '50%' : '100%' }}
            ></div>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleFirstStepSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                required
                className="calculator-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                className="calculator-input"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Business Email *
              </label>
              <input
                id="email"
                type="email"
                required
                className={`calculator-input ${emailError ? 'border-red-500' : ''}`}
                value={formData.email}
                onChange={handleEmailChange}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Please use your business email address (personal emails like Gmail or Yahoo are not accepted)
              </p>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                id="phoneNumber"
                type="tel"
                required
                className="calculator-input"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Company Website
              </label>
              <input
                id="website"
                type="url"
                className="calculator-input"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : "Continue to Business Details"}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              * Required fields. By submitting this form, you agree to be contacted about our services.
            </p>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry *
              </label>
              <select
                id="industry"
                required
                className="calculator-input"
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
                className="calculator-input"
                value={formData.employeeCount}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
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
                {isSubmitting ? 'Processing...' : "Let's Calculate Your Savings"}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              * Required fields. By submitting this form, you agree to be contacted about our services.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
