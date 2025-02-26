
import React from 'react';
import { Button } from "@/components/ui/button";
import type { CalculationResults } from '@/hooks/useCalculator';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

interface ResultsDisplayProps {
  results: CalculationResults;
  onGenerateReport: () => void;
  reportGenerated: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onGenerateReport,
  reportGenerated
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="calculator-card">
        <h3 className="text-xl font-medium text-gray-900 mb-6">Results</h3>

        {/* Human Resource Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Human Resource Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Daily Hours per Employee:</p>
              <p className="font-medium">{results.humanHours.dailyPerEmployee} hours</p>
            </div>
            <div>
              <p className="text-gray-600">Total Weekly Hours:</p>
              <p className="font-medium">{formatNumber(results.humanHours.weeklyTotal)} hours</p>
            </div>
            <div>
              <p className="text-gray-600">Total Monthly Hours:</p>
              <p className="font-medium">{formatNumber(results.humanHours.monthlyTotal)} hours</p>
            </div>
            <div>
              <p className="text-gray-600">Total Yearly Hours:</p>
              <p className="font-medium">{formatNumber(results.humanHours.yearlyTotal)} hours</p>
            </div>
          </div>
        </div>

        {/* Monthly Costs */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Monthly Human Cost:</span>
            <span className="font-semibold">{formatCurrency(results.humanCostMonthly)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Monthly AI Cost:</span>
            <span className="font-semibold">{formatCurrency(results.aiCostMonthly.total)}</span>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-700 font-medium">Monthly Savings:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(results.monthlySavings)}
              </span>
            </div>
          </div>
        </div>

        {/* Annual Savings */}
        <div className="bg-brand-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Annual Savings:</span>
            <span className="font-bold text-brand-600 text-lg">
              {formatCurrency(results.yearlySavings)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-600">Savings Percentage:</span>
            <span className="font-semibold text-brand-600">
              {formatPercentage(results.savingsPercentage)}
            </span>
          </div>
        </div>

        {/* Break-even Points */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Break-even Points</h4>
          {results.breakEvenPoint.voice > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Voice Calls:</span>
              <span>{formatNumber(results.breakEvenPoint.voice)} minutes</span>
            </div>
          )}
          {results.breakEvenPoint.chatbot > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Chat Messages:</span>
              <span>{formatNumber(results.breakEvenPoint.chatbot)} messages</span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button
            onClick={onGenerateReport}
            className="w-full"
            variant={reportGenerated ? "outline" : "default"}
          >
            {reportGenerated ? "Report Generated!" : "Generate Detailed Report"}
          </Button>
        </div>
      </div>
    </div>
  );
};
