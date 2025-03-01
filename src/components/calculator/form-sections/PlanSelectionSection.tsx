
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
  return (
    <TierComparison 
      currentTier={currentTier} 
      onSelectTier={onSelectTier} 
      currentAIType={currentAIType}
    />
  );
};
