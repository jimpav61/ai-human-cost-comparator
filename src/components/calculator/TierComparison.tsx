
import React from 'react';
import { Check, X } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { AI_RATES, TIER_DESCRIPTIONS, TIER_FEATURES } from '@/constants/pricing';

interface TierComparisonProps {
  currentTier: string;
  currentAIType: 'voice' | 'chatbot' | 'both';
  onSelectTier: (tier: string) => void;
}

export const TierComparison: React.FC<TierComparisonProps> = ({ 
  currentTier, 
  currentAIType,
  onSelectTier
}) => {
  const isVoiceEnabled = currentAIType === 'voice' || currentAIType === 'both';
  const isChatEnabled = currentAIType === 'chatbot' || currentAIType === 'both';

  return (
    <div className="grid grid-cols-3 gap-4">
      {['starter', 'growth', 'premium'].map((tier) => {
        // Determine if this tier is compatible with the current AI type selection
        const isCompatible = !(tier === 'starter' && isVoiceEnabled);
        
        return (
          <div 
            key={tier}
            className={`p-3 rounded-lg ${
              currentTier === tier 
                ? 'bg-brand-100 border-2 border-brand-500' 
                : isCompatible 
                  ? 'bg-white border border-gray-200 hover:border-brand-300 cursor-pointer'
                  : 'bg-gray-100 border border-gray-200 opacity-70 cursor-not-allowed'
            }`}
            onClick={() => isCompatible && onSelectTier(tier)}
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
                {formatCurrency(AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].base)}/month
              </div>
              <div className="text-xs text-gray-600">
                + One-time Setup Fee: {formatCurrency(AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].setupFee)} (Non-Refundable)
              </div>
            </div>

            <div className="text-sm mb-2">
              <div className="font-medium">Annual Plan:</div>
              <div className={`${!isCompatible ? 'text-gray-500' : 'text-gray-800'}`}>
                {formatCurrency(AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].annualPrice)}
              </div>
              <div className="text-xs text-green-600 font-medium">
                (Includes 2 Months FREE!)
              </div>
            </div>

            {tier === 'growth' && (
              <div className="text-sm mb-2">
                <div className="font-medium">Basic Voice AI:</div>
                <div className="text-gray-600">
                  Includes {AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].includedVoiceMinutes} voice minutes
                </div>
                <div className="text-gray-600">
                  12¢ per minute after {AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].includedVoiceMinutes} minutes
                </div>
              </div>
            )}

            {tier === 'premium' && (
              <div className="text-sm mb-2">
                <div className="font-medium">Conversational Voice AI:</div>
                <div className="text-gray-600">
                  Includes {AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].includedVoiceMinutes} voice minutes
                </div>
                <div className="text-gray-600">
                  12¢ per minute after {AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].includedVoiceMinutes} minutes
                </div>
                <div className="text-green-600 font-medium text-xs mt-1">
                  Advanced conversational capabilities included!
                </div>
              </div>
            )}

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
            
            {!isCompatible && (
              <div className="mt-3 bg-red-50 p-2 rounded text-xs text-red-500 border border-red-100">
                Not compatible with Voice AI
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
