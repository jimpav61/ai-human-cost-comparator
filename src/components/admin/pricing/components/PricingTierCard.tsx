
import React from 'react';
import { Input } from "@/components/ui/input";
import { PricingConfiguration } from '@/types/pricing';
import { PricingFormField } from './PricingFormField';

interface PricingTierCardProps {
  config: PricingConfiguration;
  handleInputChange: (
    tier: string,
    field: keyof PricingConfiguration,
    value: string
  ) => void;
}

export const PricingTierCard = ({ config, handleInputChange }: PricingTierCardProps) => {
  const formFields = [
    {
      label: "Voice AI (per minute)",
      field: 'voice_per_minute' as keyof PricingConfiguration,
      step: "0.001",
      min: "0"
    },
    {
      label: "Chatbot Base Price (per month)",
      field: 'chatbot_base_price' as keyof PricingConfiguration,
      step: "1",
      min: "0"
    },
    {
      label: "Chatbot Price (per message)",
      field: 'chatbot_per_message' as keyof PricingConfiguration,
      step: "0.001",
      min: "0"
    },
    {
      label: "Setup Fee (one-time)",
      field: 'setup_fee' as keyof PricingConfiguration,
      step: "1",
      min: "0"
    },
    {
      label: "Annual Price",
      field: 'annual_price' as keyof PricingConfiguration,
      step: "1",
      min: "0"
    },
    {
      label: "Included Voice Minutes",
      field: 'included_voice_minutes' as keyof PricingConfiguration,
      step: "1",
      min: "0"
    },
  ];

  const getTierDisplayName = (tier: string) => {
    return tier === 'starter' ? 'Starter Plan' : 
           tier === 'growth' ? 'Growth Plan' : 
           'Premium Plan';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold capitalize mb-4">
        {getTierDisplayName(config.tier)}
      </h3>
      
      <div className="grid gap-4">
        {formFields.map((field) => (
          <PricingFormField
            key={field.field}
            label={field.label}
            value={config[field.field] as number}
            onChange={(e) => handleInputChange(config.tier, field.field, e.target.value)}
            step={field.step}
            min={field.min}
          />
        ))}
      </div>
    </div>
  );
};
