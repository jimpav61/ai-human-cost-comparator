
import React from "react";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface AITypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  currentTier: string;
}

export const AITypeSelector = ({ value, onChange, currentTier }: AITypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="aiType" className="text-sm font-medium">AI Type</Label>
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger id="aiType" className="w-full">
          <SelectValue placeholder="Select AI type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="chatbot">Text Only</SelectItem>
          <SelectItem value="voice" disabled={currentTier === 'starter'}>
            Basic Voice Only
          </SelectItem>
          <SelectItem value="conversationalVoice" disabled={currentTier !== 'premium'}>
            Conversational Voice Only
          </SelectItem>
          <SelectItem value="both" disabled={currentTier === 'starter'}>
            Text & Basic Voice
          </SelectItem>
          <SelectItem value="both-premium" disabled={currentTier !== 'premium'}>
            Text & Conversational Voice
          </SelectItem>
        </SelectContent>
      </Select>
      
      {currentTier === 'starter' && value !== 'chatbot' && (
        <p className="text-xs text-amber-600 mt-1">
          Starter Plan only supports text capabilities
        </p>
      )}
      
      {currentTier !== 'premium' && (value === 'conversationalVoice' || value === 'both-premium') && (
        <p className="text-xs text-amber-600 mt-1">
          Conversational voice requires Premium Plan
        </p>
      )}
    </div>
  );
};
