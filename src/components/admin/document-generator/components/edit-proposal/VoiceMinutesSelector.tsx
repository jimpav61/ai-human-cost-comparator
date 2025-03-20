
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VoiceMinutesSelectorProps {
  value: number;
  onChange: (minutes: number) => void;
  currentTier: string;
}

export const VoiceMinutesSelector = ({ value, onChange, currentTier }: VoiceMinutesSelectorProps) => {
  // Generate voice minute options in increments of 50
  const minuteOptions = Array.from({ length: 21 }, (_, i) => i * 50);
  
  // Handle disabled state for starter tier
  const isDisabled = currentTier === 'starter';
  
  // If switching to starter tier, automatically set voice minutes to 0
  React.useEffect(() => {
    if (currentTier === 'starter' && value !== 0) {
      onChange(0);
    }
  }, [currentTier, value, onChange]);
  
  return (
    <div className="space-y-2">
      <Label htmlFor="voiceMinutes">Additional Voice Minutes</Label>
      <Select
        disabled={isDisabled}
        value={value.toString()}
        onValueChange={(val) => onChange(parseInt(val, 10))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select additional voice minutes" />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((minutes) => (
            <SelectItem key={minutes} value={minutes.toString()}>
              {minutes === 0 ? 'None' : `${minutes} minutes`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {currentTier !== 'starter' ? (
        <p className="text-xs text-gray-500">
          600 minutes included with plan. Additional minutes cost $0.12 per minute.
        </p>
      ) : (
        <Alert variant="destructive" className="py-2 mt-2">
          <AlertDescription>
            Voice capabilities not available with Starter plan.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
