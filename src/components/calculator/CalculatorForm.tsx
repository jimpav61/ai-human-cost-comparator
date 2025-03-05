import React from 'react';
import { toast } from "@/components/ui/use-toast";
import type { CalculatorInputs } from '@/hooks/useCalculator';
import { PlanSelectionSection } from './form-sections/PlanSelectionSection';
import { JobConfigurationSection } from './form-sections/JobConfigurationSection';
import { AITypeSection } from './form-sections/AITypeSection';
import { VoiceConfigSection } from './form-sections/VoiceConfigSection';
import { ChatConfigSection } from './form-sections/ChatConfigSection';
import { AI_RATES } from '@/constants/pricing';

interface CalculatorFormProps {
  inputs: CalculatorInputs;
  onInputChange: (field: keyof CalculatorInputs, value: any) => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ inputs, onInputChange }) => {
  // Handle direct AI type changes
  const handleAITypeChange = (value: string) => {
    console.log("CalculatorForm: Changing AI type to:", value);
    
    // Logic to update tier based on AI type selection
    if ((value === 'voice' || value === 'both') && inputs.aiTier === 'starter') {
      console.log("CalculatorForm: Voice AI selected, upgrading to Growth tier");
      onInputChange('aiTier', 'growth');
      
      // Don't auto-calculate a default call volume
      // Let the user set it themselves
      
      toast({
        title: "Plan Upgraded",
        description: "Voice capabilities require Growth Plan or higher. We've automatically upgraded your selection.",
      });
    } 
    else if ((value === 'conversationalVoice' || value === 'both-premium') && inputs.aiTier !== 'premium') {
      console.log("CalculatorForm: Conversational Voice AI selected, upgrading to Premium tier");
      onInputChange('aiTier', 'premium');
      
      // Don't auto-calculate a default call volume
      // Let the user set it themselves
      
      toast({
        title: "Plan Upgraded",
        description: "Conversational Voice AI requires Premium Plan. We've automatically upgraded your selection.",
      });
    }
    
    // Finally update the AI type
    onInputChange('aiType', value as any);
  };

  // Handle tier selections from the plan selection section
  const handleTierSelect = (tier: string) => {
    console.log("CalculatorForm: Tier selected:", tier);
    
    // Update AI type based on tier selection
    if (tier === 'starter') {
      if (inputs.aiType !== 'chatbot') {
        console.log("CalculatorForm: Downgrading to starter, switching to chatbot only");
        onInputChange('aiType', 'chatbot');
        onInputChange('callVolume', 0);
        
        toast({
          title: "Voice Features Disabled",
          description: "Starter Plan only supports text capabilities. Voice features have been disabled.",
          variant: "default",
        });
      }
    } 
    else if (tier === 'growth') {
      if (inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium') {
        // Downgrade from premium voice to basic voice
        const newType = inputs.aiType === 'conversationalVoice' ? 'voice' : 'both';
        console.log(`CalculatorForm: Downgrading to growth, changing AI type from ${inputs.aiType} to ${newType}`);
        onInputChange('aiType', newType as any);
        
        toast({
          title: "Voice Capabilities Adjusted",
          description: "Voice capabilities have been adjusted to basic for the Growth Plan.",
          variant: "default",
        });
      } 
      else if (inputs.aiType === 'chatbot') {
        // When upgrading from starter to growth, suggest enabling voice
        console.log("CalculatorForm: Upgrading to growth from chatbot only, suggesting voice features");
        onInputChange('aiType', 'both' as any);
        
        // Keep call volume at 0, don't auto-calculate it
        // Let the user set it themselves
        
        toast({
          title: "Voice Features Enabled",
          description: "Growth Plan includes voice capabilities. We've enabled them for you.",
          variant: "default",
        });
      }
    } 
    else if (tier === 'premium') {
      if (inputs.aiType === 'voice') {
        console.log("CalculatorForm: Upgrading to premium, enhancing voice to conversational");
        onInputChange('aiType', 'conversationalVoice' as any);
        
        toast({
          title: "Voice Features Enhanced",
          description: "Premium Plan includes conversational voice. We've upgraded your voice capabilities.",
          variant: "default",
        });
      } 
      else if (inputs.aiType === 'both') {
        console.log("CalculatorForm: Upgrading to premium, enhancing to premium voice features");
        onInputChange('aiType', 'both-premium' as any);
        
        toast({
          title: "Voice Features Enhanced",
          description: "Premium Plan includes conversational voice. We've upgraded your voice capabilities.",
          variant: "default",
        });
      } 
      else if (inputs.aiType === 'chatbot') {
        console.log("CalculatorForm: Upgrading to premium from chatbot only, enabling all premium features");
        onInputChange('aiType', 'both-premium' as any);
        
        // Keep call volume at 0, don't auto-calculate it
        // Let the user set it themselves
        
        toast({
          title: "Premium Features Enabled",
          description: "Premium Plan includes our most advanced voice capabilities. We've enabled them for you.",
          variant: "default",
        });
      }
    }
    
    // Actually update the tier
    onInputChange('aiTier', tier as any);
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
            aiTier={inputs.aiTier}
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
