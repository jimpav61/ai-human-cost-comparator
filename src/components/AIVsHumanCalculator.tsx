
import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { useCalculator, type CalculatorInputs } from '@/hooks/useCalculator';
import { CalculatorForm } from './calculator/CalculatorForm';
import { ResultsDisplay } from './calculator/ResultsDisplay';
import type { LeadData } from './calculator/types';
import { fetchPricingConfigurations } from '@/constants/pricing';

interface AIVsHumanCalculatorProps {
  leadData: LeadData;
}

export const AIVsHumanCalculator: React.FC<AIVsHumanCalculatorProps> = ({ leadData }) => {
  const [reportGenerated, setReportGenerated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState<CalculatorInputs>({
    aiType: 'voice',
    aiTier: 'standard',
    role: 'customerService',
    numEmployees: leadData.employeeCount || 1,
    callVolume: 1000,
    avgCallDuration: 5,
    chatVolume: 5000,
    avgChatLength: 8,
    avgChatResolutionTime: 12
  });

  useEffect(() => {
    const loadPricing = async () => {
      try {
        await fetchPricingConfigurations();
      } catch (error) {
        console.error('Error loading pricing:', error);
        toast({
          title: "Error",
          description: "Failed to load pricing data. Using default values.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPricing();
  }, []);

  const results = useCalculator(inputs);

  const handleInputChange = (field: keyof CalculatorInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateReport = () => {
    toast({
      title: "Report Generated",
      description: "Your cost comparison report is ready to download.",
      duration: 3000,
    });
    setReportGenerated(true);
    setTimeout(() => setReportGenerated(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="glass-morphism premium-shadow rounded-3xl overflow-hidden">
          <div className="p-8 flex justify-center items-center">
            <div className="animate-pulse">Loading pricing data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="glass-morphism premium-shadow rounded-3xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8 animate-fadeIn">
            Voice AI Cost Calculator
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <CalculatorForm 
              inputs={inputs}
              onInputChange={handleInputChange}
            />
            
            <ResultsDisplay
              results={results}
              onGenerateReport={handleGenerateReport}
              reportGenerated={reportGenerated}
              inputs={inputs}
              leadData={leadData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
