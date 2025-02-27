
import React from 'react';
import { AIVsHumanCalculator } from "@/components/AIVsHumanCalculator";
import { LeadForm, type LeadFormData } from "@/components/LeadForm";

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
  return (
    <>
      {!showCalculator ? (
        <LeadForm onSubmit={onLeadSubmit} />
      ) : (
        <div className="animate-fadeIn">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Welcome, {leadData?.name}!
            </h2>
            <p className="text-gray-600">
              Let's calculate potential AI savings for {leadData?.companyName} in the {leadData?.industry} industry
            </p>
          </div>
          <AIVsHumanCalculator leadData={leadData!} />
        </div>
      )}
    </>
  );
};

export default CalculatorSection;
