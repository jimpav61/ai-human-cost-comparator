
import React, { useState, useEffect } from 'react';
import { ResultsSummary } from './ResultsSummary';
import { ResultsDetailView } from './ResultsDetailView';
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from './pricingDetailsCalculator';
import type { CalculationResults, CalculatorInputs } from '@/hooks/useCalculator';
import type { LeadData } from './types';
import { generateAndDownloadReport } from '@/utils/reportGenerator';
import { Lead } from '@/types/leads';
import { toast } from '@/components/ui/use-toast';

interface ResultsDisplayProps {
  results: CalculationResults;
  onGenerateReport: () => void;
  reportGenerated: boolean;
  inputs: CalculatorInputs;
  leadData: LeadData;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onGenerateReport,
  reportGenerated,
  inputs,
  leadData,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const pricingDetails = calculatePricingDetails(inputs);
  const tierDisplayName = getTierDisplayName(inputs.aiTier);
  const aiTypeDisplay = getAITypeDisplay(inputs.aiType);
  
  // For debugging
  useEffect(() => {
    console.log("ResultsDisplay - Lead ID:", leadData.id);
    console.log("ResultsDisplay - Inputs:", inputs);
    console.log("ResultsDisplay - Results:", results);
    console.log("ResultsDisplay - PricingDetails:", pricingDetails);
  }, [inputs, results, pricingDetails, leadData]);
  
  // Create a Lead object from the leadData and calculator results
  // Ensure ID is preserved for exact lookup later
  const leadForReport: Lead = {
    id: leadData.id || 'temp-id',
    name: leadData.name,
    company_name: leadData.companyName,
    email: leadData.email,
    phone_number: leadData.phoneNumber || '',
    website: leadData.website || '',
    industry: leadData.industry || '',
    employee_count: leadData.employeeCount || 0,
    calculator_inputs: inputs as any,
    calculator_results: results as any,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    proposal_sent: false,
    form_completed: true
  };

  const handleDownloadReport = () => {
    try {
      console.log("Downloading report with lead ID:", leadForReport.id);
      console.log("Full lead object for report:", JSON.stringify(leadForReport));
      generateAndDownloadReport(leadForReport);
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="animate-fadeIn">
      <ResultsSummary
        results={results}
        reportGenerated={reportGenerated}
        handleGenerateReport={onGenerateReport}
        tierDisplayName={tierDisplayName}
        aiTypeDisplay={aiTypeDisplay}
      />

      {reportGenerated && (
        <div className="mt-4">
          <button
            onClick={handleDownloadReport}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Download Detailed Report
          </button>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-brand-600 hover:text-brand-800 font-medium transition-colors duration-200"
        >
          {showDetails ? 'Hide Details' : 'View Detailed Breakdown'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-4">
          <ResultsDetailView
            results={results}
            inputs={inputs}
            pricingDetails={pricingDetails}
            tierDisplayName={tierDisplayName}
            aiTypeDisplay={aiTypeDisplay}
          />
        </div>
      )}
    </div>
  );
};
