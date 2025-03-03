
import React, { useState } from 'react';
import { ResultsSummary } from './ResultsSummary';
import { ResultsDetailView } from './ResultsDetailView';
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from './pricingDetailsCalculator';
import type { CalculationResults, CalculatorInputs } from '@/hooks/useCalculator';
import type { LeadData } from './types';
import { ReportGenerator } from '@/components/admin/document-generator/components/ReportGenerator';
import { Lead } from '@/types/leads';

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

  // Create a Lead object from the leadData and calculator results
  // Convert typed objects to plain objects for database compatibility
  const leadForReport: Lead = {
    id: leadData.id || 'temp-id',
    name: leadData.name,
    company_name: leadData.companyName,
    email: leadData.email,
    phone_number: leadData.phoneNumber || '',
    website: leadData.website || '',
    industry: leadData.industry || '',
    employee_count: leadData.employeeCount || 0,
    calculator_inputs: { ...inputs } as any,
    calculator_results: { ...results } as any,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    proposal_sent: false,
    form_completed: true
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
          <ReportGenerator lead={leadForReport} buttonStyle="large" />
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
