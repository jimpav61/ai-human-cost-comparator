
import React, { useEffect } from 'react';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { formatCurrency } from '@/utils/formatters';

interface VoiceConfigSectionProps {
  callVolume: number;
  aiTier: string;
  onInputChange: (field: keyof CalculatorInputs, value: any) => void;
}

export const VoiceConfigSection: React.FC<VoiceConfigSectionProps> = ({
  callVolume,
  aiTier,
  onInputChange
}) => {
  const includedMinutes = aiTier === 'starter' ? 0 : 600;
  const isStarterPlan = aiTier === 'starter';
  
  // Reset call volume to 0 when tier changes to starter
  useEffect(() => {
    if (isStarterPlan && callVolume > 0) {
      console.log("VoiceConfigSection: Resetting call volume to 0 for starter plan");
      onInputChange('callVolume', 0);
    }
  }, [aiTier, isStarterPlan, callVolume, onInputChange]);
  
  // Handle call volume changes
  const handleCallVolumeChange = (value: number) => {
    console.log(`VoiceConfigSection: Call volume changed to ${value}`);
    
    if (isStarterPlan && value > 0) {
      // If user tries to add minutes in starter plan, auto-upgrade to growth
      console.log("VoiceConfigSection: Call volume > 0 on starter plan, upgrading to Growth tier");
      onInputChange('aiTier', 'growth');
      onInputChange('callVolume', value);
      
      toast({
        title: "Plan Upgraded",
        description: "Voice capabilities require Growth Plan or higher. We've automatically upgraded your selection.",
        variant: "default",
      });
    } else {
      // Normal handling for non-starter plans
      onInputChange('callVolume', value);
    }
  };
  
  // Calculate additional voice minutes for display
  const additionalVoiceMinutes = Math.max(0, callVolume - includedMinutes);
  const additionalCost = additionalVoiceMinutes * 0.12; // Always 12¢ per minute
  
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monthly Call Volume (minutes)
        </label>
        <Input 
          type="number" 
          min={0}
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
        {!isStarterPlan && additionalVoiceMinutes > 0 && (
          <p className="text-xs text-amber-600 mt-1">
            {additionalVoiceMinutes.toFixed(0)} additional minutes at 12¢/min = ${additionalCost.toFixed(2)}
          </p>
        )}
        {isStarterPlan && (
          <p className="text-xs text-amber-600 mt-1">
            The Starter Plan does not include voice capabilities
          </p>
        )}
      </div>
    </>
  );
};
