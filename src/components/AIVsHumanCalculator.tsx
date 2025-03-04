
import React, { useState, useEffect } from 'react';
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
    console.log(`Changing ${field} to:`, value);
    
    setCalculatorInputs(prev => {
      const updatedInputs = { ...prev, [field]: value };
      
      // If changing to starter plan, ensure call volume is 0 and type is chatbot
      if (field === 'aiTier' && value === 'starter') {
        updatedInputs.callVolume = 0;
        updatedInputs.aiType = 'chatbot';
      }
      
      // If changing to premium plan, update AI type for voice capabilities
      if (field === 'aiTier' && value === 'premium') {
        if (prev.aiType === 'voice') {
          updatedInputs.aiType = 'conversationalVoice';
        } else if (prev.aiType === 'both') {
          updatedInputs.aiType = 'both-premium';
        } else if (prev.aiType === 'chatbot') {
          // For premium tier, default to full capabilities
          updatedInputs.aiType = 'both-premium';
        }
        console.log("Updated to premium tier, new AI type:", updatedInputs.aiType);
        
        // Set a default call volume for premium if it was 0
        if (prev.callVolume === 0) {
          const includedMinutes = AI_RATES.chatbot.premium.includedVoiceMinutes || 600;
          updatedInputs.callVolume = Math.floor(includedMinutes / prev.avgCallDuration);
        }
      }
      
      // If changing from premium to growth and using premium voice features
      if (field === 'aiTier' && value === 'growth') {
        if (prev.aiType === 'conversationalVoice') {
          updatedInputs.aiType = 'voice';
          console.log("Downgraded from premium to growth tier, changed AI type from conversationalVoice to voice");
        } else if (prev.aiType === 'both-premium') {
          updatedInputs.aiType = 'both';
          console.log("Downgraded from premium to growth tier, changed AI type from both-premium to both");
        }
      }
      
      // If changing AI type to voice-based option from text, ensure tier is at least growth
      if (field === 'aiType' && 
         (value === 'voice' || value === 'both') && 
         prev.aiTier === 'starter') {
        updatedInputs.aiTier = 'growth';
        
        // Set a default call volume if upgrading to voice
        const includedMinutes = AI_RATES.chatbot.growth.includedVoiceMinutes || 600;
        updatedInputs.callVolume = Math.floor(includedMinutes / prev.avgCallDuration);
      }
      
      // If changing AI type to premium voice options, ensure tier is premium
      if (field === 'aiType' && 
         (value === 'conversationalVoice' || value === 'both-premium') && 
         prev.aiTier !== 'premium') {
        updatedInputs.aiTier = 'premium';
        
        // Set a default call volume if upgrading to premium voice
        const includedMinutes = AI_RATES.chatbot.premium.includedVoiceMinutes || 600;
        updatedInputs.callVolume = Math.floor(includedMinutes / prev.avgCallDuration);
      }
      
      return updatedInputs;
    });
  };
  
  // Generate report and save to database
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
      
      console.log("Saving report data to database:", reportData);
      
      // Fix TypeScript error by using type assertion
      const { error } = await supabase
        .from('generated_reports')
        .insert([reportData] as any);

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
