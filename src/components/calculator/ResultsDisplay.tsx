
import React from 'react';
import { Button } from "@/components/ui/button";
import type { ResultsDisplayProps } from './types';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { Download } from 'lucide-react';
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
  inputs
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
    const contactInfo = window.prompt("Please enter your name to generate the report:");
    const companyName = window.prompt("Please enter your company name:");
    const email = window.prompt("Please enter your email address:");
    const phoneNumber = window.prompt("Please enter your phone number (optional):");
    
    if (!contactInfo || !companyName || !email) {
      toast({
        title: "Missing Information",
        description: "Please provide the required contact information to generate the report.",
        variant: "destructive"
      });
      return;
    }

    try {
      const doc = generatePDF({
        contactInfo,
        companyName,
        email,
        phoneNumber,
        results,
        businessSuggestions,
        aiPlacements
      });

      const { error } = await supabase
        .from('leads')
        .insert({
          name: contactInfo,
          company_name: companyName,
          email: email,
          phone_number: phoneNumber,
          calculator_inputs: inputs as unknown as Json,
          calculator_results: results as unknown as Json
        });

      if (error) throw error;

      doc.save(`${companyName}-AI-Integration-Analysis.pdf`);
      
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
