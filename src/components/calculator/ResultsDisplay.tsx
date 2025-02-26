
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
      details.push({
        title: 'Voice AI Pricing',
        base: null,
        rate: `${formatCurrency(results.aiCostMonthly.voice)} per minute`,
        totalMinutes: inputs.callVolume * inputs.avgCallDuration,
        monthlyCost: results.aiCostMonthly.voice
      });
    }

    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
      details.push({
        title: 'Chatbot Pricing',
        base: results.aiCostMonthly.chatbot,
        rate: 'Per message',
        totalMessages: inputs.chatVolume * inputs.avgChatLength,
        monthlyCost: results.aiCostMonthly.chatbot
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
    <div className="space