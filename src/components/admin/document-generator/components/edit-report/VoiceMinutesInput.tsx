
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VoiceMinutesInputProps {
  value: number | string | undefined;
  onChange: (value: number) => void;
}

export const VoiceMinutesInput = ({ value, onChange }: VoiceMinutesInputProps) => {
  // Force conversion to number for consistency - handle all edge cases
  const numericValue = typeof value === 'number' ? value :
                      typeof value === 'string' && value !== '' ? parseInt(value, 10) || 0 : 0;
  
  console.log("VoiceMinutesInput RENDER - value:", value, "type:", typeof value, "converted:", numericValue);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Always convert to number before sending to parent
    const newValue = parseInt(e.target.value, 10) || 0;
    console.log("VoiceMinutesInput CHANGE - from:", e.target.value, "to number:", newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="voice-minutes">Additional Voice Minutes</Label>
      <Input 
        id="voice-minutes"
        type="number"
        min="0"
        value={numericValue}
        onChange={handleChange}
        placeholder="0"
      />
      <p className="text-sm text-gray-500">
        Enter the number of additional voice minutes beyond the included amount. This will be billed at $0.12 per minute.
      </p>
    </div>
  );
};
