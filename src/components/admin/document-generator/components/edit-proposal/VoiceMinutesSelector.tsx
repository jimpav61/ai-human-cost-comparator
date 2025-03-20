
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";

interface VoiceMinutesSelectorProps {
  value: number;
  onChange: (value: number) => void;
  currentTier: string;
}

export const VoiceMinutesSelector = ({ value, onChange, currentTier }: VoiceMinutesSelectorProps) => {
  // Create preset volume options in increments of 50 up to 1000
  const volumeOptions = Array.from({ length: 21 }, (_, i) => i * 50);
  
  // Cost calculations
  const additionalVoiceCost = value * 0.12;
  const includedVoiceMinutes = currentTier === 'starter' ? 0 : 600;
  const isStarterPlan = currentTier === 'starter';
  
  return (
    <div className="space-y-2">
      <Label htmlFor="callVolume" className="text-sm font-medium">Additional Voice Minutes</Label>
      <Select
        value={String(value)}
        onValueChange={(newValue) => onChange(parseInt(newValue, 10))}
        disabled={isStarterPlan}
      >
        <SelectTrigger id="callVolume" className="w-full">
          <SelectValue placeholder="Select additional minutes" />
        </SelectTrigger>
        <SelectContent>
          {volumeOptions.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option} minutes
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {!isStarterPlan && (
        <p className="text-xs text-green-600 mt-1">
          Your plan includes {includedVoiceMinutes} free voice minutes per month
        </p>
      )}
      
      {!isStarterPlan && value > 0 && (
        <p className="text-xs text-amber-600 mt-1">
          {value} additional minutes at 12¢/min = {formatCurrency(additionalVoiceCost)}
        </p>
      )}
      
      {isStarterPlan && (
        <p className="text-xs text-amber-600 mt-1">
          The Starter Plan does not include voice capabilities
        </p>
      )}
    </div>
  );
};
