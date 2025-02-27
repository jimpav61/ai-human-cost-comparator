
import React, { useState } from 'react';
import { 
  BarChart,
  Clock, 
  Download, 
  DollarSign,
  BarChart3
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';
import type { CalculationResults, CalculatorInputs } from '@/hooks/useCalculator';
import { PricingDetails } from './PricingDetails';
import type { ResultsDisplayProps, PricingDetail } from './types';
import { generatePDF } from './pdfGenerator';
import { Button } from '@/components/ui/button';
import { AI_RATES, HUMAN_HOURLY_RATES } from '@/constants/pricing';

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onGenerateReport,
  reportGenerated,
  inputs,
  leadData,
}) => {
  const [activeTab, setActiveTab] = useState('summary');

  const handleGenerateReport = () => {
    onGenerateReport();
  };

  const pricingDetails: PricingDetail[] = [];

  if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
    const totalMinutes = inputs.callVolume * inputs.avgCallDuration;
    // Calculate the chargeable minutes (total minus included minutes)
    const includedMinutes = AI_RATES.chatbot[inputs.aiTier].includedVoiceMinutes || 0;
    const chargeableMinutes = Math.max(0, totalMinutes - includedMinutes);
    pricingDetails.push({
      title: 'Voice AI',
      base: null,
      rate: `${formatCurrency(AI_RATES.voice[inputs.aiTier])}/minute after ${includedMinutes} included minutes`,
      totalMinutes: totalMinutes,
      monthlyCost: results.aiCostMonthly.voice,
    });
  }

  if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
    pricingDetails.push({
      title: 'Text AI',
      base: AI_RATES.chatbot[inputs.aiTier].base,
      rate: `${formatCurrency(AI_RATES.chatbot[inputs.aiTier].perMessage)}/message`,
      totalMessages: inputs.chatVolume * inputs.avgChatLength,
      monthlyCost: results.aiCostMonthly.chatbot,
    });
  }

  const downloadPDF = () => {
    // Generate suggestions based on the business and calculator results
    const businessSuggestions = [
      {
        title: "Automate Customer Support",
        description: "Implement our AI system to handle routine customer inquiries 24/7, freeing up your team for complex issues."
      },
      {
        title: "Integration with Existing Systems",
        description: "Our AI solutions seamlessly integrate with your current CRM and communication tools for a unified workflow."
      },
      {
        title: "Scalable Growth Solution",
        description: "As your business grows, our AI scales with you without proportional increases in operational costs."
      }
    ];

    // Generate AI placement recommendations
    const aiPlacements = [
      {
        role: "Customer Support",
        capabilities: [
          "Answer frequently asked questions",
          "Process simple service requests",
          "Provide product information"
        ]
      },
      {
        role: "Sales Assistance",
        capabilities: [
          "Qualify leads 24/7",
          "Schedule appointments",
          "Answer product questions"
        ]
      },
      {
        role: "Internal Operations",
        capabilities: [
          "Automate data entry tasks",
          "Process routine internal requests",
          "Provide employee information"
        ]
      }
    ];

    const doc = generatePDF({
      contactInfo: leadData.name,
      companyName: leadData.companyName,
      email: leadData.email,
      phoneNumber: leadData.phoneNumber,
      industry: leadData.industry,
      employeeCount: leadData.employeeCount,
      results,
      businessSuggestions,
      aiPlacements
    });

    doc.save(`${leadData.companyName.replace(/\s+/g, '-')}_AI_Analysis.pdf`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="calculator-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium text-gray-900">Results Analysis</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={() => setActiveTab('summary')}
            >
              <BarChart3 className="mr-1 h-4 w-4" />
              Summary
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={() => setActiveTab('details')}
            >
              <DollarSign className="mr-1 h-4 w-4" />
              Details
            </Button>
            <Button
              onClick={downloadPDF}
              size="sm"
              className="flex items-center"
            >
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        {activeTab === 'summary' && (
          <div>
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
        )}

        {activeTab === 'details' && (
          <div>
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
        )}
      </div>
    </div>
  );
};
