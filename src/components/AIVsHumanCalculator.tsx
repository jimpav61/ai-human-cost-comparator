
import React, { useState, useEffect } from 'react';
import { useCalculator, type CalculatorInputs } from '@/hooks/useCalculator';
import { CalculatorForm } from './calculator/CalculatorForm';
import { ResultsDisplay } from './calculator/ResultsDisplay';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BusinessSuggestionsAndPlacements } from './calculator/BusinessSuggestionsAndPlacements';
import type { LeadData } from './calculator/types';

interface AIVsHumanCalculatorProps {
  leadData: LeadData;
}

export const AIVsHumanCalculator: React.FC<AIVsHumanCalculatorProps> = ({ leadData }) => {
  // Initialize with defaults
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>({
    aiType: 'chatbot',
    aiTier: 'growth',
    role: 'customerService',
    numEmployees: 10,
    callVolume: 2000,
    avgCallDuration: 4.5,
    chatVolume: 5000,
    avgChatLength: 8,
    avgChatResolutionTime: 10,
  });
  
  const [reportGenerated, setReportGenerated] = useState(false);
  
  // Use the custom hook to get calculation results
  const calculationResults = useCalculator(calculatorInputs);
  
  // Handle input changes from the calculator form
  const handleInputChange = (field: keyof CalculatorInputs, value: any) => {
    setCalculatorInputs(prev => ({ ...prev, [field]: value }));
  };
  
  // Generate report and save to database
  const handleGenerateReport = async () => {
    try {
      const { error } = await supabase
        .from('generated_reports')
        .insert([
          {
            contact_name: leadData.name,
            company_name: leadData.companyName,
            email: leadData.email,
            phone_number: leadData.phoneNumber || null,
            calculator_inputs: calculatorInputs,
            calculator_results: calculationResults,
          }
        ]);

      if (error) throw error;

      setReportGenerated(true);
      toast({
        title: "Report Generated",
        description: "A detailed report has been prepared for you to review.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CalculatorForm 
          inputs={calculatorInputs} 
          onInputChange={handleInputChange} 
        />
        
        <ResultsDisplay 
          results={calculationResults}
          onGenerateReport={handleGenerateReport}
          reportGenerated={reportGenerated}
          inputs={calculatorInputs}
          leadData={leadData}
        />
      </div>
      
      {reportGenerated && (
        <div className="mt-12 animate-fadeIn">
          <BusinessSuggestionsAndPlacements 
            industry={leadData.industry} 
            tier={calculatorInputs.aiTier}
          />
        </div>
      )}
    </div>
  );
};
