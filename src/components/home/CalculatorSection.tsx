
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
    <div className="mb-8">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-red-600">ChatSites.ai ROI Calculator</h3>
        <p className="text-gray-600">
          See how our AI solutions can reduce costs and improve efficiency for your business
        </p>
      </div>
      <LeadForm onSubmit={onLeadSubmit} />
    </div>
  );
};

export default CalculatorSection;
