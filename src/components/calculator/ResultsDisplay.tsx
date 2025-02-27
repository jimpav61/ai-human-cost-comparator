
import React, { useState } from 'react';
import { 
  BarChart3, 
  DollarSign,
  Download
} from 'lucide-react';
import type { CalculationResults, CalculatorInputs } from '@/hooks/useCalculator';
import type { ResultsDisplayProps } from './types';
import { generatePDF } from './pdfGenerator';
import { Button } from '@/components/ui/button';
import { ResultsSummary } from './ResultsSummary';
import { ResultsDetailView } from './ResultsDetailView';
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from './pricingDetailsCalculator';

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onGenerateReport,
  reportGenerated,
  inputs,
  leadData,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleGenerateReport = () => {
    onGenerateReport();
  };

  const pricingDetails = calculatePricingDetails(inputs);
  const tierDisplayName = getTierDisplayName(inputs.aiTier);
  const aiTypeDisplay = getAITypeDisplay(inputs.aiType);

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
      aiPlacements,
      tierName: tierDisplayName,
      aiType: aiTypeDisplay
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
              variant={showDetails ? "outline" : "default"}
              size="sm"
              className="flex items-center"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <>
                  <BarChart3 className="mr-1 h-4 w-4" />
                  Show Summary
                </>
              ) : (
                <>
                  <DollarSign className="mr-1 h-4 w-4" />
                  Show Details
                </>
              )}
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

        {!showDetails ? (
          <ResultsSummary 
            results={results}
            reportGenerated={reportGenerated}
            handleGenerateReport={handleGenerateReport}
            tierDisplayName={tierDisplayName}
            aiTypeDisplay={aiTypeDisplay}
          />
        ) : (
          <ResultsDetailView
            results={results}
            inputs={inputs}
            pricingDetails={pricingDetails}
            tierDisplayName={tierDisplayName}
            aiTypeDisplay={aiTypeDisplay}
          />
        )}
      </div>
    </div>
  );
};
