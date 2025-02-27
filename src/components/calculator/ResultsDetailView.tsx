
import React from 'react';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';
import type { CalculationResults, CalculatorInputs } from '@/hooks/useCalculator';
import { PricingDetails } from './PricingDetails';
import type { PricingDetail } from './types';
import { HUMAN_HOURLY_RATES, AI_RATES } from '@/constants/pricing';

interface ResultsDetailViewProps {
  results: CalculationResults;
  inputs: CalculatorInputs;
  pricingDetails: PricingDetail[];
  tierDisplayName: string;
  aiTypeDisplay: string;
}

export const ResultsDetailView: React.FC<ResultsDetailViewProps> = ({
  results,
  inputs,
  pricingDetails,
  tierDisplayName,
  aiTypeDisplay,
}) => {
  return (
    <div>
      <div className="bg-brand-50 p-3 rounded-lg mb-4 border border-brand-100">
        <div className="flex items-center">
          <div className="text-brand-600 font-medium">Selected Plan:</div>
          <div className="ml-2 text-gray-800">
            {tierDisplayName} ({aiTypeDisplay})
          </div>
        </div>
      </div>
      
      <h4 className="font-medium text-gray-900 mb-3">AI Cost Breakdown</h4>
      <PricingDetails 
        details={pricingDetails}
        setupFee={results.aiCostMonthly.setupFee}
        annualPlan={results.annualPlan}
        includedVoiceMinutes={AI_RATES.chatbot[inputs.aiTier].includedVoiceMinutes}
      />
      
      <h4 className="font-medium text-gray-900 mt-6 mb-3">Human Resource Costs</h4>
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium text-gray-900">Total Human Labor</span>
          <span className="text-gray-900 font-semibold">{formatCurrency(results.humanCostMonthly)}/month</span>
        </div>
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex justify-between">
            <span>Hourly rate:</span>
            <span>{formatCurrency(HUMAN_HOURLY_RATES[inputs.role])}/hour</span>
          </div>
          <div className="flex justify-between">
            <span>Monthly hours:</span>
            <span>{formatNumber(results.humanHours.monthlyTotal)} hours</span>
          </div>
          <div className="flex justify-between">
            <span>Annual labor cost:</span>
            <span>{formatCurrency(results.humanCostMonthly * 12)}</span>
          </div>
        </div>
      </div>
      
      <h4 className="font-medium text-gray-900 mt-6 mb-3">Cost Comparison</h4>
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600 mb-1">Monthly Savings</div>
            <div className="text-xl font-semibold text-green-600">{formatCurrency(results.monthlySavings)}</div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">Annual Savings</div>
            <div className="text-xl font-semibold text-green-600">{formatCurrency(results.yearlySavings)}</div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">Cost Reduction</div>
            <div className="text-xl font-semibold text-brand-600">{formatPercent(results.savingsPercentage)}</div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">Break-even</div>
            <div className="text-xl font-semibold">
              {results.monthlySavings > 0 
                ? `${Math.ceil(results.aiCostMonthly.setupFee / results.monthlySavings)} months` 
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
