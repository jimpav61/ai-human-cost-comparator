
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VoiceMinutesInputProps {
  value: number | string | undefined;
  onChange: (value: number) => void;
}

export const VoiceMinutesInput = ({ value, onChange }: VoiceMinutesInputProps) => {
  // Ensure the value is a number for display purposes - parse more strictly
  const displayValue = typeof value === 'number' ? value : 
                      (value !== undefined && value !== null && value !== '' ? 
                      parseInt(String(value), 10) : 0);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse to number and pass to parent - ensure we're always passing a number
    const numValue = parseInt(e.target.value, 10) || 0;
    
    // Log the value being set for debugging
    console.log("VoiceMinutesInput: Setting call volume to:", numValue);
    
    // Always pass a number to the parent component
    onChange(numValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="voice-minutes">Additional Voice Minutes</Label>
      <Input 
        id="voice-minutes"
        type="number"
        min="0"
        value={displayValue}
        onChange={handleChange}
        placeholder="0"
      />
      <p className="text-sm text-gray-500">
        Enter the number of additional voice minutes beyond the included amount.
      </p>
    </div>
  );
};
