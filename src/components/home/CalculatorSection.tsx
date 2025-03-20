
import React from 'react';
import { AIVsHumanCalculator } from "@/components/AIVsHumanCalculator";
import { LeadForm, type LeadFormData } from "@/components/lead-form";

interface CalculatorSectionProps {
  showCalculator: boolean;
  leadData: LeadFormData | null;
  onLeadSubmit: (data: LeadFormData) => void;
}

const CalculatorSection: React.FC<CalculatorSectionProps> = ({ 
  showCalculator, 
  leadData, 
  onLeadSubmit 
}) => {
  if (showCalculator) {
    return (
      <div className="animate-fadeIn">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Welcome, {leadData?.name}!
          </h2>
          <p className="text-gray-600">
            Let's calculate how ChatSites.ai can deliver significant AI savings for {leadData?.companyName} in the {leadData?.industry} industry
          </p>
          <p className="text-sm text-red-600 mt-2">
            90% of our clients see ROI within the first 30 days of implementation
          </p>
        </div>
        <AIVsHumanCalculator leadData={leadData!} />
      </div>
    );
  }
  
  return (
    <div className="my-8 bg-pink-50 py-8 rounded-xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Get Your Free AI Savings Report</h2>
        <p className="text-gray-600 mt-2">
          Fill out the form below to receive a personalized analysis of how AI can benefit your business
        </p>
      </div>
      <LeadForm onSubmit={onLeadSubmit} />
    </div>
  );
};

export default CalculatorSection;
