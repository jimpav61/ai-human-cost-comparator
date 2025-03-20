
import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { AI_RATES, TIER_DESCRIPTIONS, TIER_FEATURES } from '@/constants/pricing';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TierComparisonProps {
  currentTier: string;
  currentAIType: string;
  onSelectTier: (tier: string) => void;
}

export const TierComparison: React.FC<TierComparisonProps> = ({ 
  currentTier, 
  currentAIType,
  onSelectTier
}) => {
  const isVoiceEnabled = ['voice', 'conversationalVoice', 'both', 'both-premium'].includes(currentAIType);
  const isConversationalVoice = ['conversationalVoice', 'both-premium'].includes(currentAIType);
  const isChatEnabled = ['chatbot', 'both', 'both-premium'].includes(currentAIType);

  // Track expanded state for each tier
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({
    starter: false,
    growth: false,
    premium: false
  });

  // Toggle expanded state for a tier
  const toggleTierExpanded = (tier: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent tier selection when clicking the expand button
    setExpandedTiers(prev => ({
      ...prev,
      [tier]: !prev[tier]
    }));
  };

  // Use this to determine if a tier is compatible with the current AI type
  const getTierCompatibility = (tier: string): {isCompatible: boolean; reason?: string} => {
    if (tier === 'starter' && isVoiceEnabled) {
      return { isCompatible: false, reason: 'Starter plan does not support voice capabilities' };
    }
    if (tier === 'growth' && isConversationalVoice) {
      return { isCompatible: false, reason: 'Conversational Voice requires Premium plan' };
    }
    return { isCompatible: true };
  };

  // Handle tier selection with appropriate logging
  const handleTierClick = (tier: string) => {
    console.log(`TierComparison: User clicked on tier ${tier}`);
    const { isCompatible } = getTierCompatibility(tier);
    
    // Always allow tier selection, even if not compatible
    // The parent component will handle adjusting AI type if needed
    console.log(`TierComparison: Selected tier ${tier}, compatibility: ${isCompatible}`);
    onSelectTier(tier);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {['starter', 'growth', 'premium'].map((tier) => {
        const { isCompatible, reason } = getTierCompatibility(tier);
        const isExpanded = expandedTiers[tier];
        
        // Get the exact fixed price for this tier from AI_RATES
        const exactPrice = AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].base;
        
        return (
          <div 
            key={tier}
            className={`p-3 rounded-lg ${
              currentTier === tier 
                ? 'bg-brand-100 border-2 border-brand-500' 
                : 'bg-white border border-gray-200 hover:border-brand-300 cursor-pointer'
            }`}
            onClick={() => handleTierClick(tier)}
          >
            <div className="text-center mb-3">
              <h5 className={`font-semibold text-lg capitalize ${!isCompatible ? 'text-gray-500' : ''}`}>
                {tier === 'starter' ? 'Starter Plan' : 
                 tier === 'growth' ? 'Growth Plan' : 
                 'Premium Plan'}
              </h5>
              <div className="text-xs text-gray-500 mt-1">
                {tier === 'starter' ? '– Text Only' : 
                 tier === 'growth' ? '– Text & Basic Voice' : 
                 '– Text & Conversational Voice'}
              </div>
            </div>
            
            <div className="text-sm mb-2">
              <div className="font-medium">Monthly Price:</div>
              <div className={`font-semibold text-lg ${!isCompatible ? 'text-gray-500' : 'text-gray-800'}`}>
                {formatCurrency(exactPrice)}/month
              </div>
              <div className="text-xs text-gray-600">
                + One-time Setup Fee: {formatCurrency(AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].setupFee)} (Non-Refundable)
              </div>
            </div>

            <Collapsible open={isExpanded} className="w-full">
              <div className="text-sm mb-2">
                <div className="font-medium">Annual Plan:</div>
                <div className={`${!isCompatible ? 'text-gray-500' : 'text-gray-800'}`}>
                  {formatCurrency(AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].annualPrice)}
                </div>
                <div className="text-xs text-green-600 font-medium">
                  (Includes 2 Months FREE!)
                </div>
              </div>

              {tier !== 'starter' && (
                <div className="text-sm mb-2">
                  <div className="font-medium">
                    {tier === 'growth' ? 'Basic Voice AI:' : 'Conversational Voice AI:'}
                  </div>
                  <div className="text-gray-600">
                    Includes 600 voice minutes
                  </div>
                  <div className="text-gray-600">
                    12¢ per minute after 600 minutes
                  </div>
                  {tier === 'premium' && (
                    <div className="text-green-600 font-medium text-xs mt-1">
                      Advanced conversational capabilities included!
                    </div>
                  )}
                </div>
              )}

              <CollapsibleContent className="pt-2">
                <div className="text-sm mb-3">
                  <div className={`italic ${!isCompatible ? 'text-gray-500' : 'text-gray-600'}`}>
                    {TIER_DESCRIPTIONS[tier as keyof typeof TIER_DESCRIPTIONS]}
                  </div>
                </div>

                <div className="mt-2 text-sm">
                  <ul className="space-y-1">
                    {TIER_FEATURES[tier as keyof typeof TIER_FEATURES].map((feature, index) => (
                      <li key={index} className={`flex items-center ${!isCompatible ? 'text-gray-500' : ''}`}>
                        <Check className={`h-3 w-3 mr-1 ${!isCompatible ? 'text-gray-400' : 'text-green-500'}`} /> 
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {tier === 'starter' && (
                  <div className="mt-3 text-xs text-gray-500 flex items-center">
                    <X className="h-3 w-3 mr-1 text-red-500" /> 
                    AI-Powered Voice Responses
                  </div>
                )}
                
                {tier === 'growth' && (
                  <div className="mt-3 text-xs text-gray-500 flex items-center">
                    <X className="h-3 w-3 mr-1 text-red-500" /> 
                    Advanced Conversational Voice
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
            
            <CollapsibleTrigger 
              asChild
              onClick={(e) => toggleTierExpanded(tier, e)}
              className="w-full mt-3"
            >
              <button className="text-xs text-brand-500 hover:text-brand-700 flex items-center justify-center w-full rounded-md py-1 hover:bg-gray-50">
                {isExpanded ? (
                  <>
                    Show Less <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Show More <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </button>
            </CollapsibleTrigger>
            
            {!isCompatible && (
              <div className="mt-3 bg-red-50 p-2 rounded text-xs text-red-500 border border-red-100">
                {reason || "Not compatible with current selection"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
