
import React, { useState } from 'react';
import { useCalculator, type CalculatorInputs } from '@/hooks/useCalculator';
import { CalculatorForm } from './calculator/CalculatorForm';
import { ResultsDisplay } from './calculator/ResultsDisplay';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BusinessSuggestionsAndPlacements } from './calculator/BusinessSuggestionsAndPlacements';
import type { LeadData } from './calculator/types';
import { AI_RATES } from '@/constants/pricing';

interface AIVsHumanCalculatorProps {
  leadData: LeadData;
}

export const AIVsHumanCalculator: React.FC<AIVsHumanCalculatorProps> = ({ leadData }) => {
  // Get the default included minutes for the selected plan
  const defaultTier = 'growth';
  const defaultIncludedMinutes = AI_RATES.chatbot[defaultTier]?.includedVoiceMinutes || 600;
  
  // Initialize with defaults - ensure chatbot type has 0 call volume
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>({
    aiType: 'chatbot',
    aiTier: 'starter',
    role: 'customerService',
    numEmployees: leadData.employeeCount || 10,
    callVolume: 0, // Start with 0 for starter plan
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
    setCalculatorInputs(prev => {
      const updatedInputs = { ...prev, [field]: value };
      
      // If changing to starter plan, ensure call volume is 0
      if (field === 'aiTier' && value === 'starter') {
        updatedInputs.callVolume = 0;
      }
      // If changing to a plan with voice, ensure call volume is at least the included minutes
      else if (field === 'aiTier' && value !== 'starter') {
        const includedMinutes = AI_RATES.chatbot[value]?.includedVoiceMinutes || 0;
        if (updatedInputs.callVolume < includedMinutes) {
          updatedInputs.callVolume = includedMinutes;
        }
      }
      
      return updatedInputs;
    });
  };
  
  // Generate report and save to database - removing proposal references
  const handleGenerateReport = async () => {
    try {
      // Create a single record object and convert it to proper JSON format
      const reportData = {
        contact_name: leadData.name,
        company_name: leadData.companyName,
        email: leadData.email,
        phone_number: leadData.phoneNumber || null,
        calculator_inputs: calculatorInputs,
        calculator_results: calculationResults,
      };
      
      // Fix TypeScript error by using type assertion
      const { error } = await supabase
        .from('generated_reports')
        .insert([reportData] as any); // Use type assertion to bypass TypeScript check

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
