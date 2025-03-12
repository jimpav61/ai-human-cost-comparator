
import React from 'react';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChatConfigSectionProps {
  chatVolume: number;
  onInputChange: (field: keyof CalculatorInputs, value: any) => void;
}

export const ChatConfigSection: React.FC<ChatConfigSectionProps> = ({
  chatVolume,
  onInputChange
}) => {
  // Logging for debugging
  console.log("ChatConfigSection rendering with chatVolume:", chatVolume);
  
  // Handle change to ensure it's a number
  const handleChatVolumeChange = (value: string) => {
    const numValue = parseInt(value, 10) || 0;
    console.log("ChatConfigSection: chat volume changed to", numValue);
    onInputChange('chatVolume', numValue);
  };
  
  return (
    <div className="mb-4">
      <Label htmlFor="chatVolume" className="block text-sm font-medium text-gray-700 mb-1">
        Monthly Chat Volume
      </Label>
      <Input 
        id="chatVolume"
        type="number" 
        min="1"
        value={chatVolume}
        onChange={(e) => handleChatVolumeChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
};
