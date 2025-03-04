
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
  // Get the base price directly from the results to ensure consistency
  const basePrice = results.basePriceMonthly;
  const setupFee = results.aiCostMonthly.setupFee;
  const additionalVoiceCost = results.aiCostMonthly.voice;
  const totalMinutes = inputs.callVolume * inputs.avgCallDuration;
  const includedMinutes = AI_RATES.chatbot[inputs.aiTier].includedVoiceMinutes || 0;
  const extraMinutes = Math.max(0, totalMinutes - includedMinutes);
  const additionalVoiceRate = AI_RATES.chatbot[inputs.aiTier].additionalVoiceRate || AI_RATES.voice[inputs.aiTier];
  
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
        setupFee={setupFee}
        annualPlan={results.annualPlan}
        includedVoiceMinutes={includedMinutes}
      />
      
      {extraMinutes > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 mt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-amber-600">Additional Voice Minutes</span>
            <span className="text-gray-900 font-semibold">{formatCurrency(additionalVoiceCost)}</span>
          </div>
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Extra minutes beyond included {includedMinutes}:</span>
              <span>{formatNumber(extraMinutes)} minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Rate per additional minute:</span>
              <span>{formatCurrency(additionalVoiceRate)}</span>
            </div>
          </div>
        </div>
      )}
      
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
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-100 p-4">
            <div className="text-gray-700 mb-1">Current Human Staff Cost</div>
            <div className="text-xl font-semibold text-gray-900">{formatCurrency(results.humanCostMonthly)}/month</div>
          </div>
          <div className="bg-green-50 p-4 border-t border-b border-green-100">
            <div className="text-brand-700 mb-1">Your ChatSites.ai Cost</div>
            <div className="text-xl font-semibold text-brand-600">{formatCurrency(results.aiCostMonthly.total)}/month</div>
          </div>
          <div className="bg-gray-50 p-4">
            <div className="text-green-700 mb-1">Monthly Savings</div>
            <div className="text-xl font-semibold text-green-600">{formatCurrency(results.monthlySavings)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
