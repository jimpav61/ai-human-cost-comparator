
import React, { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LeadFormProps {
  onSubmit: (data: LeadFormData) => void;
}

export interface LeadFormData {
  name: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  website: string;
}

export const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    companyName: '',
    email: '',
    phoneNumber: '',
    website: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.companyName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Store lead in Supabase
      const { error } = await supabase
        .from('leads')
        .insert({
          name: formData.name,
          company_name: formData.companyName,
          email: formData.email,
          phone_number: formData.phoneNumber || null,
          website: formData.website || null,
          calculator_inputs: {}, // This will be populated when calculator is used
          calculator_results: {} // This will be populated when calculator is used
        });

      if (error) throw error;

      // Call the onSubmit prop to notify parent component
      onSubmit(formData);
      
      toast({
        title: "Success!",
        description: "Your information has been submitted successfully.",
      });

    } catch (error) {
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
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Business Email *
            </label>
            <input
              id="email"
              type="email"
              required
              className="calculator-input"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              className="calculator-input"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : "Let's Calculate Your Savings"}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            * Required fields. By submitting this form, you agree to be contacted about our services.
          </p>
        </form>
      </div>
    </div>
  );
};
