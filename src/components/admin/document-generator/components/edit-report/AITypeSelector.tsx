
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalculatorInputs } from "@/hooks/calculator/types";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle,
  Phone,
  Zap,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AITypeSelectorProps {
  value: CalculatorInputs['aiType'];
  onChange: (value: string) => void;
  tier: CalculatorInputs['aiTier'];
}

export const AITypeSelector = ({ value, onChange, tier }: AITypeSelectorProps) => {
  // Feature compatibility with tiers
  const featureCompatibility = {
    chatbot: ['starter', 'growth', 'premium'],
    voice: ['growth', 'premium'],
    both: ['growth', 'premium'],
    conversationalVoice: ['premium'],
    'both-premium': ['premium']
  };
  
  // Display names for each AI type
  const aiTypeDisplayNames = {
    chatbot: 'Text Only',
    voice: 'Basic Voice',
    both: 'Text & Basic Voice',
    conversationalVoice: 'Conversational Voice',
    'both-premium': 'Text & Conversational Voice'
  };
  
  // Feature descriptions
  const featureDescriptions = {
    chatbot: 'Text-based AI interactions via web chat, messaging apps, and email',
    voice: 'Basic scripted voice responses with simple call routing',
    both: 'Combined text and basic voice capabilities',
    conversationalVoice: 'Advanced voice AI with natural dialogue and complex problem solving',
    'both-premium': 'Full suite of text and advanced conversational voice capabilities'
  };
  
  // Get compatibility status
  const isCompatible = (aiType: string): boolean => {
    return featureCompatibility[aiType as keyof typeof featureCompatibility]?.includes(tier) || false;
  };
  
  // Get badge color based on compatibility
  const getBadgeColor = (aiType: string): string => {
    if (!isCompatible(aiType)) return 'bg-gray-100 text-gray-500';
    if (aiType === value) return 'bg-green-100 text-green-800';
    
    switch (aiType) {
      case 'chatbot': return 'bg-blue-100 text-blue-800';
      case 'voice': return 'bg-purple-100 text-purple-800';
      case 'both': return 'bg-indigo-100 text-indigo-800';
      case 'conversationalVoice': return 'bg-amber-100 text-amber-800';
      case 'both-premium': return 'bg-rose-100 text-rose-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Warning message for incompatible selections
  const getCompatibilityMessage = (aiType: string): string | null => {
    if (isCompatible(aiType)) return null;
    
    switch (aiType) {
      case 'voice':
      case 'both':
        return `Requires Growth or Premium plan`;
      case 'conversationalVoice':
      case 'both-premium':
        return `Requires Premium plan`;
      default:
        return `Not compatible with ${tier} plan`;
    }
  };
  
  // Render a feature badge
  const renderFeatureBadge = (aiType: string) => {
    const compatible = isCompatible(aiType);
    const isSelected = value === aiType;
    const badgeColor = getBadgeColor(aiType);
    const message = getCompatibilityMessage(aiType);
    
    return (
      <TooltipProvider key={aiType}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`flex items-center gap-1 mb-2 cursor-pointer ${compatible ? 'opacity-100' : 'opacity-60'}`}
              onClick={() => {
                if (compatible) onChange(aiType);
              }}
            >
              <Badge 
                variant="outline"
                className={`${badgeColor} px-2 py-1 flex items-center gap-1 ${isSelected ? 'ring-1 ring-green-500' : ''}`}
              >
                {aiType === 'chatbot' && <MessageCircle className="h-3 w-3" />}
                {(aiType === 'voice' || aiType === 'both') && <Phone className="h-3 w-3" />}
                {(aiType === 'conversationalVoice' || aiType === 'both-premium') && <Zap className="h-3 w-3" />}
                
                {aiTypeDisplayNames[aiType as keyof typeof aiTypeDisplayNames]}
                
                {isSelected && <CheckCircle2 className="h-3 w-3 ml-1 text-green-500" />}
                {!compatible && <XCircle className="h-3 w-3 ml-1 text-gray-400" />}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="max-w-xs">
            <p>{featureDescriptions[aiType as keyof typeof featureDescriptions]}</p>
            {message && (
              <p className="text-amber-500 text-xs mt-1 font-medium">{message}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="aiType" className="text-sm font-medium">AI Type</Label>
      
      <div className="mb-3 flex flex-col space-y-1">
        {renderFeatureBadge('chatbot')}
        {renderFeatureBadge('voice')}
        {renderFeatureBadge('both')}
        {renderFeatureBadge('conversationalVoice')}
        {renderFeatureBadge('both-premium')}
      </div>
      
      <Select 
        value={value} 
        onValueChange={onChange}
      >
        <SelectTrigger id="aiType" className="w-full">
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
      
      <p className="text-xs text-gray-500 mt-1">
        {value === 'chatbot' ? 'Text-only AI for chat-based interactions' :
         value === 'voice' ? 'Basic voice-only AI responses for calls' :
         value === 'both' ? 'Combined text and basic voice capabilities' :
         value === 'conversationalVoice' ? 'Advanced conversational voice AI' :
         value === 'both-premium' ? 'Full suite with text and advanced voice' :
         'Select an AI type'}
      </p>
    </div>
  );
};
