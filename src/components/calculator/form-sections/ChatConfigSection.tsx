
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
        onChange={(e) => onInputChange('chatVolume', parseInt(e.target.value) || 0)}
        className="w-full"
      />
    </div>
  );
};
