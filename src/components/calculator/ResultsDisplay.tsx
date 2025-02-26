
import React from 'react';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/formatters';
import type { CalculationResults } from '@/hooks/useCalculator';

interface ResultsDisplayProps {
  results: CalculationResults;
  onGenerateReport: () => void;
  onShareResults: () => void;
  reportGenerated: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onGenerateReport,
  onShareResults,
  reportGenerated
}) => {
  const {
    aiCostMonthly,
    humanCostMonthly,
    monthlySavings,
    yearlySavings,
    savingsPercentage,
    breakEvenPoint
  } = results;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="calculator-card">
        <h3 className="text-xl font-medium text-gray-900 mb-6">Cost Analysis</h3>
        
        {/* Monthly Costs */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="result-card">
            <div className="text-sm text-gray-500 mb-1">Monthly AI Cost</div>
            <div className="text-2xl font-bold text-brand-500">
              {formatCurrency(aiCostMonthly.total)}
            </div>
          </div>
          
          <div className="result-card">
            <div className="text-sm text-gray-500 mb-1">Monthly Human Cost</div>
            <div className="text-2xl font-bold text-gray-700">
              {formatCurrency(humanCostMonthly)}
            </div>
          </div>
        </div>
        
        {/* Savings Metrics */}
        <div className="result-card mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-medium text-gray-700">Monthly Savings</div>
            <div className={`text-2xl font-bold ${monthlySavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(Math.abs(monthlySavings))}
              {monthlySavings < 0 && <span className="text-red-500"> (Loss)</span>}
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">Annual Savings</div>
            <div className={`text-lg font-semibold ${yearlySavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(Math.abs(yearlySavings))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">Cost Reduction</div>
            <div className={`text-lg font-semibold ${savingsPercentage >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatPercent(Math.abs(savingsPercentage))}
            </div>
          </div>
          
          {/* Savings visualization */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full ${savingsPercentage >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(Math.abs(savingsPercentage), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Break-even Analysis */}
        <div className="result-card mb-8">
          <div className="text-sm text-gray-500 mb-1">Break-even Point</div>
          {breakEvenPoint.voice > 0 || breakEvenPoint.chatbot > 0 ? (
            <>
              {breakEvenPoint.voice > 0 && (
                <div className="text-xl font-bold text-gray-700">
                  Voice: {formatNumber(breakEvenPoint.voice)} calls/month
                </div>
              )}
              {breakEvenPoint.chatbot > 0 && (
                <div className="text-xl font-bold text-gray-700">
                  Chatbot: {formatNumber(breakEvenPoint.chatbot)} conversations/month
                </div>
              )}
            </>
          ) : (
            <div className="text-md font-medium text-gray-700">
              {aiCostMonthly.total > humanCostMonthly 
                ? "Human agents are more cost-effective at all volumes" 
                : "AI is more cost-effective at all volumes"}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex space-x-4">
          <button 
            onClick={onGenerateReport}
            disabled={reportGenerated}
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            {reportGenerated ? 'Report Generated!' : 'Generate Report'}
          </button>
          
          <button 
            onClick={onShareResults}
            className="flex-1 border-2 border-brand-500 text-brand-500 hover:bg-brand-50 py-3 px-6 rounded-lg transition-all duration-200"
          >
            Share Results
          </button>
        </div>
      </div>
    </div>
  );
};
