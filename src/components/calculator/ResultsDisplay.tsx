import React from 'react';
import { Button } from "@/components/ui/button";
import type { ResultsDisplayProps } from './types';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import type { Json } from '@/integrations/supabase/types';
import { PricingDetails } from './PricingDetails';
import { TierComparison } from './TierComparison';
import { BusinessSuggestionsAndPlacements } from './BusinessSuggestionsAndPlacements';
import { generatePDF } from './pdfGenerator';
import { AI_RATES } from '@/constants/pricing';

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onGenerateReport,
  reportGenerated,
  inputs,
  leadData
}) => {
  const businessSuggestions = [
    {
      title: "24/7 Customer Support",
      description: "Implement AI to provide round-the-clock support without increasing staff costs."
    },
    {
      title: "Rapid Response Times",
      description: "AI can handle multiple inquiries simultaneously, reducing customer wait times."
    },
    {
      title: "Cost-Effective Scaling",
      description: `Save ${formatPercent(results.savingsPercentage)} on operational costs while maintaining service quality.`
    },
    {
      title: "Employee Focus",
      description: "Free up your team to handle complex cases while AI manages routine inquiries."
    }
  ];

  const aiPlacements = [
    {
      role: "Front-line Support",
      capabilities: [
        "Handle routine customer inquiries instantly",
        "Route complex issues to human agents",
        "Available 24/7 without additional cost"
      ]
    },
    {
      role: "Customer Service Enhancement",
      capabilities: [
        "Reduce wait times significantly",
        "Process multiple requests simultaneously",
        "Maintain consistent service quality"
      ]
    }
  ];

  const getPricingDetails = () => {
    const details = [];

    if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
      const totalMinutes = inputs.callVolume * inputs.avgCallDuration;
      const voiceRate = AI_RATES.voice[inputs.aiTier];
      const voiceCost = totalMinutes * voiceRate;
      
      details.push({
        title: 'Voice AI Pricing',
        base: null,
        rate: `${formatCurrency(voiceRate)} per minute`,
        totalMinutes: totalMinutes,
        monthlyCost: voiceCost
      });
    }

    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
      const totalMessages = inputs.chatVolume * inputs.avgChatLength;
      const chatbotRates = AI_RATES.chatbot[inputs.aiTier];
      const messageCost = totalMessages * chatbotRates.perMessage;
      const totalChatbotCost = chatbotRates.base + messageCost;
      
      details.push({
        title: 'Chatbot Pricing',
        base: chatbotRates.base,
        rate: `${formatCurrency(chatbotRates.perMessage)} per message`,
        totalMessages: totalMessages,
        monthlyCost: totalChatbotCost
      });
    }

    return details;
  };

  const handleGenerateReport = async () => {
    try {
      const doc = generatePDF({
        contactInfo: leadData.name,
        companyName: leadData.companyName,
        email: leadData.email,
        phoneNumber: leadData.phoneNumber,
        results,
        businessSuggestions,
        aiPlacements
      });

      const { error } = await supabase
        .from('leads')
        .insert({
          name: leadData.name,
          company_name: leadData.companyName,
          email: leadData.email,
          phone_number: leadData.phoneNumber || null,
          calculator_inputs: inputs as unknown as Json,
          calculator_results: results as unknown as Json
        });

      if (error) throw error;

      doc.save(`${leadData.companyName}-AI-Integration-Analysis.pdf`);
      
      toast({
        title: "Report Generated Successfully",
        description: "Your report has been saved and downloaded.",
      });
      
      onGenerateReport();
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Error Saving Report",
        description: "There was an error saving your report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
          
          {/* Monthly and Annual Cost Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Monthly Overview</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Human Cost:</span>
                  <span>{formatCurrency(results.humanCostMonthly)}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Cost:</span>
                  <span>{formatCurrency(results.aiCostMonthly.total)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Monthly Savings:</span>
                  <div className="flex items-center">
                    {results.monthlySavings > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    {formatCurrency(results.monthlySavings)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Annual Overview</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Human Cost:</span>
                  <span>{formatCurrency(results.humanCostMonthly * 12)}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Cost:</span>
                  <span>{formatCurrency(results.aiCostMonthly.total * 12)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Annual Savings:</span>
                  <div className="flex items-center">
                    {results.yearlySavings > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    {formatCurrency(results.yearlySavings)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Indicator */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Savings Overview</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className={`w-5 h-5 mr-2 ${results.savingsPercentage > 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-lg font-semibold">
                  {formatPercent(Math.abs(results.savingsPercentage))}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {results.savingsPercentage > 0 ? 'Cost Reduction' : 'Cost Increase'}
              </span>
            </div>
          </div>

          {/* AI Pricing Details */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">AI Service Pricing ({inputs.aiTier} tier)</h4>
            <PricingDetails details={getPricingDetails()} />
          </div>

          {/* Tier Comparison */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Tier Comparison</h4>
            <TierComparison currentTier={inputs.aiTier} />
          </div>

          {/* Business Suggestions and AI Placements */}
          <BusinessSuggestionsAndPlacements 
            suggestions={businessSuggestions}
            placements={aiPlacements}
          />

          {/* Generate Report Button */}
          <div className="mt-6">
            <Button
              onClick={handleGenerateReport}
              disabled={reportGenerated}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {reportGenerated ? 'Report Generated' : 'Generate Detailed Report'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
