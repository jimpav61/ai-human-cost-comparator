
import React from 'react';
import { TierComparison } from '../TierComparison';
import { toast } from "@/components/ui/use-toast";
import { AI_RATES } from '@/constants/pricing';

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
    
    // Get exact prices based on tier
    const exactPrice = tier === 'starter' ? 99 : tier === 'growth' ? 229 : 429;
    const setupFee = AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].setupFee;
    
    toast({
      title: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan Selected`,
      description: `Price: $${exactPrice}/month. Setup fee: $${setupFee}. ${tier === 'starter' ? 'No voice capabilities.' : 
        `Includes ${AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].includedVoiceMinutes} voice minutes.`}`,
    });
    
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
