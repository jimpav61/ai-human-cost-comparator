
import React, { useEffect } from 'react';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { formatCurrency } from '@/utils/formatters';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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
  
  // Create preset volume options in increments of 50
  const volumeOptions = Array.from({ length: 21 }, (_, i) => i * 50);
  
  // Reset call volume to 0 when tier changes to starter
  useEffect(() => {
    if (isStarterPlan && callVolume > 0) {
      onInputChange('callVolume', 0);
    }
  }, [aiTier, isStarterPlan, callVolume, onInputChange]);
  
  // Handle call volume changes
  const handleCallVolumeChange = (value: string) => {
    // Ensure value is parsed as a number
    const numericValue = parseInt(value, 10) || 0;
    
    if (isStarterPlan && numericValue > 0) {
      // If user tries to add minutes in starter plan, auto-upgrade to growth
      onInputChange('aiTier', 'growth');
      onInputChange('callVolume', numericValue);
      
      toast({
        title: "Plan Upgraded",
        description: "Voice capabilities require Growth Plan or higher. We've automatically upgraded your selection.",
        variant: "default",
      });
    } else {
      // Normal handling for non-starter plans
      onInputChange('callVolume', numericValue);
    }
  };
  
  // Calculate additional voice minutes for display
  const additionalVoiceCost = callVolume * 0.12; // Always 12¢ per minute
  
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Voice Minutes
        </label>
        <Select
          value={String(callVolume)}
          onValueChange={handleCallVolumeChange}
          disabled={isStarterPlan}
        >
          <SelectTrigger className="calculator-input border border-red-100 focus:border-red-300">
            <SelectValue placeholder="Select volume" />
          </SelectTrigger>
          <SelectContent>
            {volumeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} minutes
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isStarterPlan && includedMinutes > 0 && (
          <p className="text-xs text-green-600 mt-1">
            Your plan includes {includedMinutes} free voice minutes per month
          </p>
        )}
        {!isStarterPlan && callVolume > 0 && (
          <p className="text-xs text-amber-600 mt-1">
            {callVolume.toFixed(0)} additional minutes at 12¢/min = {formatCurrency(additionalVoiceCost)}
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
