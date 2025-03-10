
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalculatorInputs } from "@/hooks/calculator/types";

interface AITypeSelectorProps {
  value: CalculatorInputs['aiType'];
  onChange: (value: string) => void;
  tier: CalculatorInputs['aiTier'];
}

export const AITypeSelector = ({ value, onChange, tier }: AITypeSelectorProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="aiType" className="col-span-1">AI Type</Label>
      <Select 
        value={value} 
        onValueChange={onChange}
      >
        <SelectTrigger id="aiType" className="col-span-3">
          <SelectValue placeholder="Select AI type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="chatbot">Text Only</SelectItem>
          {tier !== 'starter' && (
            <>
              <SelectItem value="voice">Basic Voice</SelectItem>
              <SelectItem value="both">Text & Basic Voice</SelectItem>
              {tier === 'premium' && (
                <>
                  <SelectItem value="conversationalVoice">Conversational Voice</SelectItem>
                  <SelectItem value="both-premium">Text & Conversational Voice</SelectItem>
                </>
              )}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
