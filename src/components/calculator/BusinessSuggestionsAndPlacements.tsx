
import React from 'react';
import type { BusinessSuggestion, AIPlacement } from './types';

interface BusinessSuggestionsAndPlacementsProps {
  industry: string;
  tier: 'starter' | 'growth' | 'premium';
}

export const BusinessSuggestionsAndPlacements: React.FC<BusinessSuggestionsAndPlacementsProps> = ({
  industry,
  tier
}) => {
  // Generate suggestions based on industry
  const suggestions: BusinessSuggestion[] = [
    {
      title: "Automate Common Customer Inquiries",
      description: "Implement an AI chatbot to handle frequently asked questions, reducing wait times and freeing up human agents."
    },
    {
      title: "Enhance After-Hours Support",
      description: "Deploy voice AI to provide 24/7 customer service without increasing staffing costs."
    },
    {
      title: "Streamline Onboarding Process",
      description: "Use AI assistants to guide new customers through product setup and initial questions."
    }
  ];

  // Generate AI placements based on tier
  const placements: AIPlacement[] = [
    {
      role: "Front-line Customer Support",
      capabilities: ["Handle basic inquiries", "Process simple requests", "Collect customer information"]
    },
    {
      role: "Technical Troubleshooting",
      capabilities: ["Guide users through common issues", "Recommend solutions based on symptoms", "Escalate complex problems to human agents"]
    },
    {
      role: "Sales Assistant",
      capabilities: ["Answer product questions", "Provide pricing information", "Schedule demonstrations with sales team"]
    }
  ];

  return (
    <>
      <div className="mb-6 p-4 bg-brand-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Business Benefits</h4>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="space-y-1">
              <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
              <p className="text-sm text-gray-600">{suggestion.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">AI Integration Opportunities</h4>
        <div className="space-y-3">
          {placements.map((placement, index) => (
            <div key={index} className="text-sm">
              <p className="font-medium text-gray-700">{placement.role}</p>
              <ul className="list-disc list-inside text-gray-600 pl-4 space-y-1">
                {placement.capabilities.map((capability, idx) => (
                  <li key={idx}>{capability}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
