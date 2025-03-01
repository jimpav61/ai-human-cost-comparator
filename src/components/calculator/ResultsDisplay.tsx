import React, { useState } from 'react';
import { ResultsSummary } from './ResultsSummary';
import { ResultsDetailView } from './ResultsDetailView';
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from './pricingDetailsCalculator';
import type { CalculationResults, CalculatorInputs } from '@/hooks/useCalculator';
import type { LeadData } from './types';

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

  return (
    <div className="animate-fadeIn">
      <ResultsSummary
        results={results}
        reportGenerated={reportGenerated}
        handleGenerateReport={onGenerateReport}
        tierDisplayName={tierDisplayName}
        aiTypeDisplay={aiTypeDisplay}
      />

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
