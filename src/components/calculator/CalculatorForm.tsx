
import React, { useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import type { CalculatorInputs } from '@/hooks/useCalculator';
import { PlanSelectionSection } from './form-sections/PlanSelectionSection';
import { JobConfigurationSection } from './form-sections/JobConfigurationSection';
import { AITypeSection } from './form-sections/AITypeSection';
import { VoiceConfigSection } from './form-sections/VoiceConfigSection';
import { ChatConfigSection } from './form-sections/ChatConfigSection';

interface CalculatorFormProps {
  inputs: CalculatorInputs;
  onInputChange: (field: keyof CalculatorInputs, value: any) => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ inputs, onInputChange }) => {
  // Select appropriate tier when AI type changes
  useEffect(() => {
    if (inputs.aiType === 'chatbot' && inputs.aiTier !== 'starter') {
      // If only text is needed, default to starter plan
      onInputChange('aiTier', 'starter');
      toast({
        title: "Plan Updated",
        description: "Switched to Starter Plan since only text capabilities are needed.",
        variant: "default",
      });
    } else if (inputs.aiType === 'voice' && inputs.aiTier === 'starter') {
      // If basic voice is needed, upgrade to growth plan
      onInputChange('aiTier', 'growth');
      toast({
        title: "Plan Upgraded",
        description: "Voice features require at least the Growth Plan. We've automatically upgraded your selection.",
        variant: "default",
      });
    } else if (inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium') {
      // If conversational voice is needed, upgrade to premium plan
      onInputChange('aiTier', 'premium');
      toast({
        title: "Premium Plan Selected",
        description: "Conversational Voice AI requires the Premium Plan. We've automatically selected it for you.",
        variant: "default",
      });
    }
  }, [inputs.aiType]);

  const handleTierSelect = (tier: string) => {
    if (tier === 'starter' && (inputs.aiType === 'voice' || inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both' || inputs.aiType === 'both-premium')) {
      toast({
        title: "Voice Features Not Available",
        description: "The Starter Plan doesn't support voice features. Please select Growth or Premium Plan for voice capabilities.",
        variant: "destructive",
      });
      return;
    }
    
    // If selecting growth tier but using conversational voice, warn the user
    if (tier === 'growth' && (inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium')) {
      toast({
        title: "Conversational Voice Not Available",
        description: "Conversational Voice AI requires the Premium Plan. Switching to basic voice capabilities.",
        variant: "warning",
      });
      onInputChange('aiType', 'voice');
    }
    
    onInputChange('aiTier', tier as any);
  };

  const handleAITypeChange = (value: string) => {
    onInputChange('aiType', value as any);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="calculator-card">
        <h3 className="text-xl font-medium text-gray-900 mb-6">Plan Selection</h3>
        
        <div className="mb-6">
          <PlanSelectionSection 
            currentTier={inputs.aiTier} 
            currentAIType={inputs.aiType}
            onSelectTier={handleTierSelect} 
          />
        </div>

        <h3 className="text-xl font-medium text-gray-900 mb-6">Configuration</h3>
        
        <JobConfigurationSection 
          role={inputs.role}
          numEmployees={inputs.numEmployees}
          onInputChange={onInputChange}
        />
        
        <AITypeSection 
          aiType={inputs.aiType}
          aiTier={inputs.aiTier}
          handleAITypeChange={handleAITypeChange}
        />
        
        {(inputs.aiType === 'voice' || inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both' || inputs.aiType === 'both-premium') && (
          <VoiceConfigSection 
            callVolume={inputs.callVolume}
            avgCallDuration={inputs.avgCallDuration}
            onInputChange={onInputChange}
          />
        )}
        
        {(inputs.aiType === 'chatbot' || inputs.aiType === 'both' || inputs.aiType === 'both-premium') && (
          <ChatConfigSection 
            chatVolume={inputs.chatVolume}
            avgChatLength={inputs.avgChatLength}
            avgChatResolutionTime={inputs.avgChatResolutionTime}
            onInputChange={onInputChange}
          />
        )}
      </div>
    </div>
  );
};
