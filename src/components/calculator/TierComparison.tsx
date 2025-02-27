
import React from 'react';
import { Check, X } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { AI_RATES, TIER_DESCRIPTIONS, TIER_FEATURES } from '@/constants/pricing';

interface TierComparisonProps {
  currentTier: string;
  onSelectTier: (tier: string) => void;
}

export const TierComparison: React.FC<TierComparisonProps> = ({ currentTier, onSelectTier }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {['starter', 'growth', 'premium'].map((tier) => (
        <div 
          key={tier}
          className={`p-3 rounded-lg ${
            currentTier === tier 
              ? 'bg-brand-100 border-2 border-brand-500' 
              : 'bg-white border border-gray-200 hover:border-brand-300 cursor-pointer'
          }`}
          onClick={() => onSelectTier(tier)}
        >
          <div className="text-center mb-3">
            <h5 className="font-semibold text-lg capitalize">
              {tier === 'starter' ? 'Starter Plan' : 
               tier === 'growth' ? 'Growth Plan' : 
               'Premium Plan'}
            </h5>
            <div className="text-xs text-gray-500 mt-1">
              {tier === 'starter' ? '– Text Only' : 
               tier === 'growth' ? '– Text & Voice' : 
               '– Full Voice & Text'}
            </div>
          </div>
          
          <div className="text-sm mb-2">
            <div className="font-medium">Monthly Price:</div>
            <div className="text-gray-800 font-semibold text-lg">
              {formatCurrency(AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].base)}/month
            </div>
            <div className="text-xs text-gray-600">
              + One-time Setup Fee: {formatCurrency(AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].setupFee)} (Non-Refundable)
            </div>
          </div>

          <div className="text-sm mb-2">
            <div className="font-medium">Annual Plan:</div>
            <div className="text-gray-800">
              {formatCurrency(AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].annualPrice)}
            </div>
            <div className="text-xs text-green-600 font-medium">
              (Includes 2 Months FREE!)
            </div>
          </div>

          {(tier === 'growth' || tier === 'premium') && (
            <div className="text-sm mb-2">
              <div className="font-medium">Voice AI:</div>
              <div className="text-gray-600">
                Includes {AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].includedVoiceMinutes} voice minutes
              </div>
              <div className="text-gray-600">
                12¢ per minute after {AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].includedVoiceMinutes} minutes
              </div>
            </div>
          )}

          <div className="text-sm mb-3">
            <div className="text-gray-600 italic">
              {TIER_DESCRIPTIONS[tier as keyof typeof TIER_DESCRIPTIONS]}
            </div>
          </div>

          <div className="mt-2 text-sm">
            <ul className="space-y-1">
              {TIER_FEATURES[tier as keyof typeof TIER_FEATURES].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-3 w-3 mr-1 text-green-500" /> 
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
        </div>
      ))}
    </div>
  );
};
