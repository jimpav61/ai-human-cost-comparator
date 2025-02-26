
import React, { useState } from 'react';
import { toast } from "@/components/ui/use-toast";

interface LeadFormProps {
  onSubmit: (data: LeadFormData) => void;
}

export interface LeadFormData {
  name: string;
  companyName: string;
  email: string;
  phoneNumber: string;
}

export const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    companyName: '',
    email: '',
    phoneNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.companyName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData);
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
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
          >
            Let's Calculate Your Savings
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            * Required fields. By submitting this form, you agree to be contacted about our services.
          </p>
        </form>
      </div>
    </div>
  );
};
