
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Phone, 
  DollarSign,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VoiceMinutesInputProps {
  value: number | string | undefined;
  onChange: (value: number) => void;
  tier?: "starter" | "growth" | "premium";
  includedMinutes?: number;
}

export const VoiceMinutesInput = ({ 
  value, 
  onChange, 
  tier = "growth",
  includedMinutes = 600
}: VoiceMinutesInputProps) => {
  // Force conversion to number for consistency - handle all edge cases
  const numericValue = typeof value === 'number' ? value :
                      typeof value === 'string' && value !== '' ? parseInt(value, 10) || 0 : 0;
  
  // Calculate additional cost
  const additionalCost = (numericValue * 0.12).toFixed(2);
  
  // Create preset values for the UI
  const presets = [0, 100, 200, 300, 500, 1000];
  
  // Handle numeric input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Always convert to number before sending to parent
    const newValue = parseInt(e.target.value, 10) || 0;
    onChange(newValue);
  };
  
  // Handle slider change
  const handleSliderChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };
  
  // Determine if voice is available for this tier
  const isVoiceAvailable = tier !== "starter";
  
  // Return a message based on the plan and minutes
  const getMessage = () => {
    if (!isVoiceAvailable) {
      return "Voice features are not available in the Starter plan. Upgrade to Growth or Premium for voice capabilities.";
    }
    
    if (numericValue === 0) {
      return `Your plan includes ${includedMinutes} voice minutes at no additional cost.`;
    }
    
    return `${numericValue} additional minutes will cost $${additionalCost} per month ($0.12/min).`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label htmlFor="voice-minutes" className="flex items-center gap-1">
          <Phone className="h-4 w-4" />
          Additional Voice Minutes
        </Label>
        
        {isVoiceAvailable && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1 cursor-help">
                  <Clock className="h-3 w-3" />
                  {includedMinutes} Included
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Your plan includes {includedMinutes} voice minutes per month at no additional cost.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <Input 
          id="voice-minutes"
          type="number"
          min="0"
          value={numericValue}
          onChange={handleInputChange}
          placeholder="0"
          disabled={!isVoiceAvailable}
          className="w-24"
        />
        
        <div className="flex-1">
          {isVoiceAvailable && (
            <Slider
              value={[numericValue]}
              min={0}
              max={1000}
              step={10}
              onValueChange={handleSliderChange}
              disabled={!isVoiceAvailable}
            />
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {isVoiceAvailable && presets.map(preset => (
          <Badge
            key={preset}
            variant="outline"
            className={`cursor-pointer ${
              numericValue === preset 
                ? 'bg-purple-100 text-purple-800 border-purple-300' 
                : 'hover:border-gray-400'
            }`}
            onClick={() => onChange(preset)}
          >
            {preset} min
          </Badge>
        ))}
      </div>
      
      <div className={`text-sm flex items-start gap-1 p-2 rounded-md ${
        !isVoiceAvailable 
          ? 'bg-amber-50 text-amber-800 border border-amber-100' 
          : numericValue > 0 
            ? 'bg-blue-50 text-blue-800 border border-blue-100'
            : 'text-gray-500'
      }`}>
        <div className="mt-0.5">
          {!isVoiceAvailable ? (
            <Info className="h-4 w-4 text-amber-500" />
          ) : numericValue > 0 ? (
            <DollarSign className="h-4 w-4 text-blue-500" />
          ) : (
            <Info className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <div>
          {getMessage()}
          {isVoiceAvailable && numericValue > 0 && (
            <div className="mt-1 text-xs font-semibold">
              Total: {includedMinutes + numericValue} minutes ({includedMinutes} included + {numericValue} additional)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
