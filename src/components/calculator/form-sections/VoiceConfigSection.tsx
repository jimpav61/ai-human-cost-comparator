
import React, { useEffect } from 'react';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import { AI_RATES } from '@/constants/pricing';
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

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
  
  // Ensure call volume respects plan tier whenever the tier changes
  useEffect(() => {
    // For starter plan, set to 0
    if (isStarterPlan && callVolume !== 0) {
      console.log("VoiceConfigSection: On starter plan but call volume not 0, resetting to 0");
      onInputChange('callVolume', 0);
    }
    
    // For growth or premium plans with included minutes, set a default value if currently at 0
    if (!isStarterPlan && (callVolume === 0 || callVolume < 50) && includedMinutes > 0) {
      // Calculate how many calls can fit within the included minutes
      // For example, if call duration is 6 minutes, 600 included minutes = 100 calls
      const suggestedVolume = Math.floor(includedMinutes / (avgCallDuration || 1));
      
      // Ensure we set a reasonable default - not too small, not too large
      const defaultVolume = Math.max(100, Math.min(suggestedVolume, 800));
      
      console.log(`VoiceConfigSection: Setting default call volume to ${defaultVolume} based on ${includedMinutes} included minutes`);
      onInputChange('callVolume', defaultVolume);
    }
  }, [aiTier, isStarterPlan, callVolume, includedMinutes, avgCallDuration, onInputChange]);
  
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monthly Call Volume
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
        <Input 
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
