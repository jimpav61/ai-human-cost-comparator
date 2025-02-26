
import React from 'react';
import { Check } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { AI_RATES } from '@/constants/pricing';

interface TierComparisonProps {
  currentTier: string;
}

export const TierComparison: React.FC<TierComparisonProps> = ({ currentTier }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {['basic', 'standard', 'premium'].map((tier) => (
        <div 
          key={tier}
          className={`p-3 rounded-lg ${
            currentTier === tier 
              ? 'bg-brand-100 border-2 border-brand-500' 
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="text-center mb-2">
            <h5 className="font-semibold capitalize">{tier}</h5>
          </div>
          
          <div className="text-sm mb-2">
            <div className="font-medium">Voice AI:</div>
            <div className="text-gray-600">
              {formatCurrency(AI_RATES.voice[tier as keyof typeof AI_RATES.voice])}/min
            </div>
          </div>

          <div className="text-sm">
            <div className="font-medium">Chatbot:</div>
            <div className="text-gray-600">
              Base: {formatCurrency(AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].base)}/month
            </div>
            <div className="text-gray-600">
              Messages: {formatCurrency(AI_RATES.chatbot[tier as keyof typeof AI_RATES.chatbot].perMessage)}/msg
            </div>
          </div>

          <div className="mt-2 text-sm">
            <ul className="space-y-1">
              {tier === 'basic' && (
                <>
                  <li className="flex items-center"><Check className="h-3 w-3 mr-1 text-green-500" /> Basic Support</li>
                  <li className="flex items-center"><Check className="h-3 w-3 mr-1 text-green-500" /> Standard Response Time</li>
                </>
              )}
              {tier === 'standard' && (
                <>
                  <li className="flex items-center"><Check className="h-3 w-3 mr-1 text-green-500" /> Priority Support</li>
                  <li className="flex items-center"><Check className="h-3 w-3 mr-1 text-green-500" /> Faster Response Time</li>
                  <li className="flex items-center"><Check className="h-3 w-3 mr-1 text-green-500" /> Advanced Analytics</li>
                </>
              )}
              {tier === 'premium' && (
                <>
                  <li className="flex items-center"><Check className="h-3 w-3 mr-1 text-green-500" /> 24/7 Priority Support</li>
                  <li className="flex items-center"><Check className="h-3 w-3 mr-1 text-green-500" /> Instant Response Time</li>
                  <li className="flex items-center"><Check className="h-3 w-3 mr-1 text-green-500" /> Advanced Analytics</li>
                  <li className="flex items-center"><Check className="h-3 w-3 mr-1 text-green-500" /> Custom Integration</li>
                </>
              )}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};
