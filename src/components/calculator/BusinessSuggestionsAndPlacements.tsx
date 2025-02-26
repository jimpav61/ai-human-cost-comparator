
import React from 'react';
import type { BusinessSuggestion, AIPlacement } from './types';

interface BusinessSuggestionsAndPlacementsProps {
  suggestions: BusinessSuggestion[];
  placements: AIPlacement[];
}

export const BusinessSuggestionsAndPlacements: React.FC<BusinessSuggestionsAndPlacementsProps> = ({
  suggestions,
  placements
}) => {
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
