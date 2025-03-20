
import { useState } from 'react';
import { LeadFormData } from '../types';
import { validateEmail, validateWebsite, normalizeWebsiteUrl } from '../utils/validation';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const initialFormData: LeadFormData = {
  name: '',
  companyName: '',
  email: '',
  phoneNumber: '',
  website: '',
  industry: '',
  employeeCount: 1
};

export const useLeadFormState = (onSubmit: (data: LeadFormData) => void) => {
  const [formData, setFormData] = useState<LeadFormData>(initialFormData);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [websiteError, setWebsiteError] = useState('');

  const handleFirstStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.companyName || !formData.phoneNumber || !formData.email || !formData.website) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to continue.",
        variant: "destructive",
      });
      return;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.errorMessage);
      toast({
        title: "Invalid Email",
        description: emailValidation.errorMessage,
        variant: "destructive",
      });
      return;
    }

    const websiteValidation = validateWebsite(formData.website);
    if (!websiteValidation.isValid) {
      setWebsiteError(websiteValidation.errorMessage);
      toast({
        title: "Invalid Website",
        description: websiteValidation.errorMessage,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let finalWebsite = normalizeWebsiteUrl(formData.website);

      console.log("Submitting to Supabase:", {
        name: formData.name,
        company_name: formData.companyName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        website: finalWebsite,
      });

      const { data, error } = await supabase
        .from('leads')
        .insert([{
          name: formData.name,
          company_name: formData.companyName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          website: finalWebsite,
          industry: "Not yet provided",
          employee_count: 0,
          calculator_inputs: {},
          calculator_results: {},
          proposal_sent: false,
          form_completed: false
        }])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      if (data && data.length > 0) {
        const leadRecord = data[0] as any;
        
        // Update form data with the normalized website
        setFormData(prev => ({ ...prev, website: finalWebsite }));
        
        // Critical fix: First make sure isSubmitting is set to false
        setIsSubmitting(false);
        
        // Then use a small timeout to ensure React has processed the state update
        // before changing the step
        setTimeout(() => {
          setLeadId(leadRecord.id);
          setStep(2);
          
          toast({
            title: "Information Saved!",
            description: "Please complete the remaining details to continue to the calculator.",
          });
        }, 50);
      } else {
        throw new Error("No data returned from database");
      }

    } catch (error: any) {
      console.error('Error submitting lead:', error);
      toast({
        title: "Submission Error",
        description: "There was an error saving your information. Please try again.",
        variant: "destructive",
      });
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
      if (leadId) {
        console.log("Updating lead:", leadId, {
          industry: formData.industry,
          employee_count: formData.employeeCount,
        });
        
        const { error } = await supabase
          .from('leads')
          .update({
            industry: formData.industry,
            employee_count: formData.employeeCount,
            form_completed: true
          } as any)
          .eq('id', leadId);

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }

        // Critical fix: Set isSubmitting to false first
        setIsSubmitting(false);
        
        // Then proceed with form submission and toasts
        setTimeout(() => {
          onSubmit(formData);
          
          toast({
            title: "Success!",
            description: "Your information has been submitted successfully.",
          });
        }, 50);
      } else {
        console.log("Full submission as fallback");
        
        const finalWebsite = normalizeWebsiteUrl(formData.website);
        
        const { data, error } = await supabase
          .from('leads')
          .insert([{
            name: formData.name,
            company_name: formData.companyName,
            email: formData.email,
            phone_number: formData.phoneNumber,
            website: finalWebsite,
            industry: formData.industry,
            employee_count: formData.employeeCount,
            calculator_inputs: {} as any,
            calculator_results: {} as any,
            proposal_sent: false,
            form_completed: true
          }])
          .select();

        if (error) {
          console.error("Supabase fallback insert error:", error);
          throw error;
        }

        if (data && data.length > 0) {
          // Critical fix: Set isSubmitting to false first
          setIsSubmitting(false);
          
          // Then proceed with form submission and toasts
          setTimeout(() => {
            onSubmit(formData);
            
            toast({
              title: "Success!",
              description: "Your information has been submitted successfully.",
            });
          }, 50);
        } else {
          throw new Error("No data returned from database");
        }
      }
    } catch (error: any) {
      console.error('Error submitting lead:', error);
      toast({
        title: "Submission Error",
        description: error?.message || "There was an error submitting your information. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return {
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
  };
};
