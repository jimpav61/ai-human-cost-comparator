
import React from 'react';
import { TierComparison } from '../TierComparison';

interface PlanSelectionSectionProps {
  currentTier: string;
  currentAIType: string;
  onSelectTier: (tier: string) => void;
}

export const PlanSelectionSection: React.FC<PlanSelectionSectionProps> = ({ 
  currentTier, 
  currentAIType, 
  onSelectTier 
}) => {
  // When a tier is selected, properly update it and log the change
  const handleTierSelection = (tier: string) => {
    console.log(`User selected tier: ${tier} from the plan selection section, current AI type: ${currentAIType}`);
    
    // Pass the tier selection up to the parent component
    onSelectTier(tier);
  };

  return (
    <TierComparison 
      currentTier={currentTier} 
      onSelectTier={handleTierSelection} 
      currentAIType={currentAIType}
    />
  );
};
