
import React, { useEffect } from 'react';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import { AI_RATES } from '@/constants/pricing';
import { toast } from "@/components/ui/use-toast";

interface VoiceConfigSectionProps {
  callVolume: number;
  avgCallDuration: number;
  aiTier: string;
  onInputChange: (field: keyof CalculatorInputs, value: any) => void;
}

export const VoiceConfigSection: React.FC<VoiceConfigSectionProps> = ({
  callVolume,
  avgCallDuration,
  aiTier,
  onInputChange
}) => {
  const includedMinutes = AI_RATES.chatbot[aiTier as keyof typeof AI_RATES.chatbot]?.includedVoiceMinutes || 0;
  const isStarterPlan = aiTier === 'starter';
  
  // Handle call volume changes
  const handleCallVolumeChange = (value: number) => {
    if (isStarterPlan && value > 0) {
      // If user tries to add minutes in starter plan, auto-upgrade to growth
      onInputChange('aiTier', 'growth');
      // Set to the included minutes of growth plan
      const growthIncludedMinutes = AI_RATES.chatbot['growth']?.includedVoiceMinutes || 600;
      onInputChange('callVolume', growthIncludedMinutes);
      
      toast({
        title: "Plan Upgraded",
        description: "Voice capabilities require Growth Plan or higher. We've automatically upgraded your selection.",
        variant: "default",
      });
    } else {
      // Normal handling for non-starter plans
      // Ensure value is a multiple of 50 for increments
      const roundedValue = Math.ceil(value / 50) * 50;
      // Ensure it's at least the included minutes
      const finalValue = Math.max(roundedValue, includedMinutes);
      onInputChange('callVolume', finalValue);
    }
  };
  
  // Ensure call volume respects included minutes whenever the tier changes
  useEffect(() => {
    // For starter plan, set to 0
    if (isStarterPlan && callVolume !== 0) {
      onInputChange('callVolume', 0);
    }
    // For other plans, ensure call volume is at least the included minutes
    else if (!isStarterPlan && callVolume < includedMinutes) {
      onInputChange('callVolume', includedMinutes);
    }
  }, [aiTier, includedMinutes, isStarterPlan, callVolume, onInputChange]);
  
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monthly Call Volume
        </label>
        <input 
          type="number" 
          min={isStarterPlan ? "0" : includedMinutes.toString()}
          step="50"
          value={callVolume}
          onChange={(e) => handleCallVolumeChange(parseInt(e.target.value) || 0)}
          className="calculator-input"
          disabled={isStarterPlan} // Disable for starter plan
        />
        {!isStarterPlan && includedMinutes > 0 && (
          <p className="text-xs text-green-600 mt-1">
            Your plan includes {includedMinutes} free voice minutes per month
          </p>
        )}
        {isStarterPlan && (
          <p className="text-xs text-amber-600 mt-1">
            The Starter Plan does not include voice capabilities
          </p>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Average Call Duration (minutes)
        </label>
        <input 
          type="number" 
          min="0.5" 
          step="0.5"
          value={avgCallDuration}
          onChange={(e) => onInputChange('avgCallDuration', parseFloat(e.target.value) || 0)}
          className="calculator-input"
          disabled={isStarterPlan} // Disable for starter plan
        />
      </div>
    </>
  );
};
