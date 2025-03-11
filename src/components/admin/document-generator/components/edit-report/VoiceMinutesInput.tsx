
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface VoiceMinutesInputProps {
  value: number;
  onChange: (value: string) => void;
}

export const VoiceMinutesInput = ({ value, onChange }: VoiceMinutesInputProps) => {
  // Ensure we always have a numeric value and it's not NaN
  const safeValue = !isNaN(Number(value)) && value !== null ? Number(value) : 0;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // We pass the raw string to the parent component
    onChange(e.target.value);
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="callVolume" className="col-span-1">
        Additional Voice Minutes
      </Label>
      <div className="col-span-3">
        <Input
          id="callVolume"
          type="number"
          value={safeValue}
          onChange={handleInputChange}
          min={0}
          step={100}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter additional minutes beyond the 600 included with your plan
        </p>
      </div>
    </div>
  );
};
