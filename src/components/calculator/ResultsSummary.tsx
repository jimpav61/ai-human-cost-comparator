
import React from 'react';
import { BarChart, Clock, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';
import type { CalculationResults } from '@/hooks/useCalculator';
import { Button } from '@/components/ui/button';

interface ResultsSummaryProps {
  results: CalculationResults;
  reportGenerated: boolean;
  handleGenerateReport: () => void;
  tierDisplayName: string;
  aiTypeDisplay: string;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  results,
  reportGenerated,
  handleGenerateReport,
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-gray-500 text-sm mb-1">Monthly Cost</div>
          <div className="text-2xl font-semibold text-gray-900">{formatCurrency(results.aiCostMonthly.total)}</div>
          <div className="mt-2 flex items-center text-xs">
            <Clock className="h-3 w-3 mr-1 text-gray-400" />
            <span className="text-gray-500">One-time setup: {formatCurrency(results.aiCostMonthly.setupFee)}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-gray-500 text-sm mb-1">Monthly Savings</div>
          <div className="text-2xl font-semibold text-green-600">{formatCurrency(results.monthlySavings)}</div>
          <div className="mt-2 flex items-center text-xs">
            <BarChart className="h-3 w-3 mr-1 text-gray-400" />
            <span className="text-gray-500">{formatPercent(results.savingsPercentage)} vs. human labor</span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-gray-500 text-sm mb-1">Annual Savings</div>
          <div className="text-2xl font-semibold text-green-600">{formatCurrency(results.yearlySavings)}</div>
          <div className="mt-2 flex items-center text-xs">
            <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
            <span className="text-gray-500">Annual plan: {formatCurrency(results.annualPlan)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Human Resource Comparison</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-gray-700 font-medium mb-2">Labor Hours</div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex justify-between">
                <span>Daily per employee:</span>
                <span>{results.humanHours.dailyPerEmployee} hours</span>
              </li>
              <li className="flex justify-between">
                <span>Weekly total:</span>
                <span>{formatNumber(results.humanHours.weeklyTotal)} hours</span>
              </li>
              <li className="flex justify-between border-t border-gray-100 pt-1 font-medium">
                <span>Monthly total:</span>
                <span>{formatNumber(results.humanHours.monthlyTotal)} hours</span>
              </li>
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-gray-700 font-medium mb-2">Labor Costs</div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex justify-between">
                <span>Human-only monthly cost:</span>
                <span>{formatCurrency(results.humanCostMonthly)}</span>
              </li>
              <li className="flex justify-between">
                <span>AI monthly cost:</span>
                <span>{formatCurrency(results.aiCostMonthly.total)}</span>
              </li>
              <li className="flex justify-between border-t border-gray-100 pt-1 font-medium text-green-600">
                <span>Monthly savings:</span>
                <span>{formatCurrency(results.monthlySavings)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button 
          onClick={handleGenerateReport}
          className="w-full"
          variant={reportGenerated ? "secondary" : "default"}
          disabled={reportGenerated}
        >
          {reportGenerated ? "Your Report is Ready" : "Generate Detailed Report & ROI Analysis"}
        </Button>
      </div>
    </div>
  );
};
