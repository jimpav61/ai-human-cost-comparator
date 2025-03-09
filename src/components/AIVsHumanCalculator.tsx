import React, { useState, useEffect } from 'react';
import { useCalculator, type CalculatorInputs } from '@/hooks/useCalculator';
import { CalculatorForm } from './calculator/CalculatorForm';
import { ResultsDisplay } from './calculator/ResultsDisplay';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BusinessSuggestionsAndPlacements } from './calculator/BusinessSuggestionsAndPlacements';
import type { LeadData } from './calculator/types';
import type { Json } from '@/integrations/supabase/types';

interface AIVsHumanCalculatorProps {
  leadData: LeadData;
}

export const AIVsHumanCalculator: React.FC<AIVsHumanCalculatorProps> = ({ leadData }) => {
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>({
    aiType: 'chatbot',
    aiTier: 'starter',
    role: 'customerService',
    numEmployees: leadData.employeeCount || 10,
    callVolume: 0,
    avgCallDuration: 0,
    chatVolume: 5000,
    avgChatLength: 0,
    avgChatResolutionTime: 0
  });
  
  const [reportGenerated, setReportGenerated] = useState(false);
  
  const calculationResults = useCalculator(calculatorInputs);
  
  const handleInputChange = (field: keyof CalculatorInputs, value: any) => {
    console.log(`AIVsHumanCalculator: Changing ${field} to:`, value);
    
    setCalculatorInputs(prev => {
      const updatedInputs = { ...prev, [field]: value };
      
      if (field === 'aiTier' && value === 'starter' && prev.aiType !== 'chatbot') {
        updatedInputs.callVolume = 0;
        updatedInputs.aiType = 'chatbot';
        console.log("AIVsHumanCalculator: Changed to Starter tier, forcing AI type to chatbot and zeroing call volume");
      }
      
      if (field === 'aiTier' && value === 'growth' && (prev.aiType === 'conversationalVoice' || prev.aiType === 'both-premium')) {
        updatedInputs.aiType = prev.aiType === 'conversationalVoice' ? 'voice' : 'both';
        console.log(`AIVsHumanCalculator: Downgraded to Growth tier, adjusted AI type from ${prev.aiType} to ${updatedInputs.aiType}`);
      }
      
      if (field === 'aiTier' && value === 'premium') {
        if (prev.aiType === 'voice') {
          updatedInputs.aiType = 'conversationalVoice';
          console.log("AIVsHumanCalculator: Upgraded to Premium tier, enhanced AI type to conversationalVoice");
        } else if (prev.aiType === 'both') {
          updatedInputs.aiType = 'both-premium';
          console.log("AIVsHumanCalculator: Upgraded to Premium tier, enhanced AI type to both-premium");
        }
      }
      
      if (field === 'aiType' && (value === 'voice' || value === 'both') && prev.aiTier === 'starter') {
        updatedInputs.aiTier = 'growth';
        console.log("AIVsHumanCalculator: Voice option selected on Starter plan, upgrading to Growth tier");
      }
      
      if (field === 'aiType' && (value === 'conversationalVoice' || value === 'both-premium') && prev.aiTier !== 'premium') {
        updatedInputs.aiTier = 'premium';
        console.log("AIVsHumanCalculator: Premium voice option selected, upgrading to Premium tier");
      }
      
      return updatedInputs;
    });
  };
  
  const handleGenerateReport = async () => {
    try {
      const reportId = crypto.randomUUID();
      
      const reportData = {
        id: reportId,
        contact_name: leadData.name,
        company_name: leadData.companyName,
        email: leadData.email,
        phone_number: leadData.phoneNumber || null,
        calculator_inputs: calculatorInputs as Json,
        calculator_results: calculationResults as Json,
        report_date: new Date().toISOString()
      };
      
      console.log("Saving report data to database:", reportData);
      
      const { error } = await supabase
        .from('generated_reports')
        .insert(reportData);

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
