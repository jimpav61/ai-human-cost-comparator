import React from 'react';
import { Button } from "@/components/ui/button";
import type { CalculationResults, CalculatorInputs } from '@/hooks/useCalculator';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';
import { Download, DollarSign, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import type { Json } from '@/integrations/supabase/types';
import { AI_RATES } from '@/constants/pricing';

interface ResultsDisplayProps {
  results: CalculationResults;
  onGenerateReport: () => void;
  reportGenerated: boolean;
  inputs: CalculatorInputs;
}

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

  const getCurrentTierRates = () => {
    const voiceRate = AI_RATES.voice[inputs.aiTier];
    const chatbotRate = AI_RATES.chatbot[inputs.aiTier];
    return { voiceRate, chatbotRate };
  };

  const getPricingDetails = () => {
    const { voiceRate, chatbotRate } = getCurrentTierRates();
    const details = [];

    if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
      details.push({
        title: 'Voice AI Pricing',
        base: null,
        rate: `${formatCurrency(voiceRate)} per minute`,
        totalMinutes: inputs.callVolume * inputs.avgCallDuration,
        monthlyCost: results.aiCostMonthly.voice
      });
    }

    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
      details.push({
        title: 'Chatbot Pricing',
        base: formatCurrency(AI_RATES.chatbot[inputs.aiTier].base),
        rate: `${formatCurrency(chatbotRate.perMessage)} per message`,
        totalMessages: inputs.chatVolume * inputs.avgChatLength,
        monthlyCost: results.aiCostMonthly.chatbot
      });
    }

    return details;
  };

  const generatePDF = async () => {
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

    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString();

    // Title
    doc.setFontSize(20);
    doc.text("AI Integration Cost Analysis Report", 20, 20);
    
    // Contact Information
    doc.setFontSize(12);
    doc.text(`Generated for: ${companyName}`, 20, 35);
    doc.text(`Contact: ${contactInfo}`, 20, 42);
    doc.text(`Email: ${email}`, 20, 49);
    if (phoneNumber) doc.text(`Phone: ${phoneNumber}`, 20, 56);
    doc.text(`Date: ${reportDate}`, 20, phoneNumber ? 63 : 56);
    
    let finalY = phoneNumber ? 73 : 66;

    // Cost Summary
    doc.setFontSize(14);
    doc.text("Cost Summary", 20, finalY);
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [["Category", "Monthly Cost", "Annual Cost"]],
      body: [
        ["Human Resources", formatCurrency(results.humanCostMonthly), formatCurrency(results.humanCostMonthly * 12)],
        ["AI Solution", formatCurrency(results.aiCostMonthly.total), formatCurrency(results.aiCostMonthly.total * 12)],
        ["Potential Savings", formatCurrency(results.monthlySavings), formatCurrency(results.yearlySavings)]
      ],
    });

    finalY = (doc as any).previousAutoTable.finalY + 20;

    // Business Recommendations
    doc.setFontSize(14);
    doc.text("Implementation Recommendations", 20, finalY);
    
    let recommendationY = finalY + 10;
    businessSuggestions.forEach((suggestion) => {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(suggestion.title, 20, recommendationY);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(suggestion.description, 20, recommendationY + 5);
      recommendationY += 15;
    });

    // Save report to leads table
    try {
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

      // Save the PDF
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
    <div className="space-y-8 animate-fadeIn">
      <div className="calculator-card">
        <h3 className="text-xl font-medium text-gray-900 mb-6">Results</h3>

        {/* AI Pricing Details */}
        <div className="mb-6 p-4 bg-brand-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">AI Service Pricing ({inputs.aiTier} tier)</h4>
          <div className="space-y-4">
            {getPricingDetails().map((detail, index) => (
              <div key={index} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{detail.title}</span>
                  <span className="text-brand-600 font-semibold">{formatCurrency(detail.monthlyCost)}/month</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {detail.base && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Base fee: {detail.base}/month
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Usage rate: {detail.rate}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">Monthly volume:</span>
                    <span className="ml-2">
                      {detail.totalMessages 
                        ? `${formatNumber(detail.totalMessages)} messages`
                        : `${formatNumber(detail.totalMinutes)} minutes`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Human Resource Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Employee Work Hours</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Hours per Employee:</p>
              <p className="font-medium">{results.humanHours.dailyPerEmployee} hours/day</p>
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
              <p className="text-gray-600">Team Size:</p>
              <p className="font-medium">{inputs.numEmployees} employees</p>
            </div>
          </div>
        </div>

        {/* Business Suggestions */}
        <div className="mb-6 p-4 bg-brand-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Business Benefits</h4>
          <div className="space-y-4">
            {businessSuggestions.map((suggestion, index) => (
              <div key={index} className="space-y-1">
                <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
                <p className="text-sm text-gray-600">{suggestion.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Placement Opportunities */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">AI Integration Opportunities</h4>
          <div className="space-y-3">
            {aiPlacements.map((placement, index) => (
              <div key={index} className="text-sm">
                <p className="font-medium text-gray-700">{placement.role}</p>
                <ul className="list-disc list-inside text-gray-600 pl-4 space-y-1">
                  {placement.capabilities.slice(0, 2).map((capability, idx) => (
                    <li key={idx}>{capability}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Costs and Savings */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Monthly Human Cost:</span>
            <span className="font-semibold">{formatCurrency(results.humanCostMonthly)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Monthly AI Cost:</span>
            <div className="text-right">
              <span className="font-semibold block">{formatCurrency(results.aiCostMonthly.total)}</span>
              <span className="text-sm text-gray-500">
                ({inputs.aiTier} tier)
              </span>
            </div>
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
              {formatPercent(results.savingsPercentage)}
            </span>
          </div>
        </div>

        {/* Break-even Points */}
        <div className="space-y-2 mb-6">
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

        {/* Download Button */}
        <div className="mt-6">
          <Button
            onClick={generatePDF}
            className="w-full bg-brand-primary hover:bg-brand-primary/90"
            disabled={reportGenerated}
          >
            <Download className="mr-2 h-4 w-4" />
            {reportGenerated ? 'Report Generated' : 'Download Detailed Report'}
          </Button>
        </div>
      </div>
    </div>
  );
};
