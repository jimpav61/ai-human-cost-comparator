
import React, { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { useCalculator, type CalculatorInputs } from '@/hooks/useCalculator';
import { CalculatorForm } from './calculator/CalculatorForm';
import { ResultsDisplay } from './calculator/ResultsDisplay';

export const AIVsHumanCalculator = () => {
  const [reportGenerated, setReportGenerated] = useState(false);
  const [inputs, setInputs] = useState<CalculatorInputs>({
    aiType: 'voice',
    aiTier: 'standard',
    role: 'customerService',
    numEmployees: 1,
    peakHourPercentage: 30, // 30% of traffic during peak hours
    overflowHandling: 50, // 50% of overflow handled by AI
    callVolume: 1000,
    avgCallDuration: 5,
    chatVolume: 5000,
    avgChatLength: 8,
    avgChatResolutionTime: 12
  });

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
            />
          </div>
        </div>
      </div>
    </div>
  );
};
