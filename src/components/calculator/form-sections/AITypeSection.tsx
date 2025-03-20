import React, { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface AITypeSectionProps {
  aiType: string;
  aiTier: string;
  handleAITypeChange: (value: string) => void;
}

export const AITypeSection: React.FC<AITypeSectionProps> = ({
  aiType,
  aiTier,
  handleAITypeChange
}) => {
  // Debug logging
  console.log("AITypeSection rendering with aiType:", aiType, "aiTier:", aiTier);
  
  // Force AI type update when tier changes
  useEffect(() => {
    console.log(`AITypeSection: Effect triggered - aiTier: ${aiTier}, aiType: ${aiType}`);
    
    // If on starter plan but not using chatbot, switch to chatbot
    if (aiTier === 'starter' && aiType !== 'chatbot') {
      console.log('On starter plan, forcing AI type to chatbot');
      handleAITypeChange('chatbot');
      toast({
        title: "AI Type Updated",
        description: "Starter Plan only supports text capabilities.",
        duration: 1500,
      });
    }
    // If on premium plan and using basic voice features, upgrade to premium voice
    else if (aiTier === 'premium') {
      if (aiType === 'voice') {
        console.log('Upgraded to premium plan, changing voice AI to conversationalVoice');
        handleAITypeChange('conversationalVoice');
        toast({
          title: "AI Type Enhanced",
          description: "Your voice capabilities have been upgraded to Conversational Voice with Premium Plan.",
          duration: 1500,
        });
      } 
      else if (aiType === 'both') {
        console.log('Upgraded to premium plan, changing both AI to both-premium');
        handleAITypeChange('both-premium');
        toast({
          title: "AI Type Enhanced",
          description: "Your voice capabilities have been upgraded to Conversational Voice with Premium Plan.",
          duration: 1500,
        });
      }
    }
    // If downgraded from premium and using premium features, downgrade features
    else if (aiTier === 'growth') {
      // Crucial fix: ensure growth tier plan has appropriate AI type
      if (aiType === 'chatbot') {
        console.log('On growth plan with chatbot only, upgrading to both (text & basic voice)');
        handleAITypeChange('both');
        toast({
          title: "AI Type Enhanced",
          description: "Growth Plan includes both Text & Basic Voice capabilities.",
          duration: 1500,
        });
      }
      else if (aiType === 'conversationalVoice' || aiType === 'both-premium') {
        const newType = aiType === 'conversationalVoice' ? 'voice' : 'both';
        console.log('Downgrading from premium to growth, changing AI type from', aiType, 'to', newType);
        handleAITypeChange(newType);
        toast({
          title: "AI Type Adjusted",
          description: "Voice capabilities have been adjusted to match your Growth Plan.",
          duration: 1500,
        });
      }
    }
  }, [aiTier, aiType, handleAITypeChange]);
  
  // Handle manual AI type changes and update tier if needed
  const handleAITypeSelectionChange = (value: string) => {
    console.log('User selected AI type:', value);
    
    // If selecting conversational voice options, ensure premium tier
    if ((value === 'conversationalVoice' || value === 'both-premium') && aiTier !== 'premium') {
      console.log('Conversational voice selected, will trigger upgrade to premium tier');
      toast({
        title: "Plan Upgrade Required",
        description: "Conversational Voice requires Premium Plan. Upgrading your selection.",
        duration: 1500,
      });
    }
    
    // If selecting basic voice options on starter, this will trigger an upgrade to growth tier
    if ((value === 'voice' || value === 'both') && aiTier === 'starter') {
      console.log('Voice options selected on starter plan, will trigger upgrade to growth tier');
      toast({
        title: "Plan Upgrade Required",
        description: "Voice capabilities require Growth Plan or higher. Upgrading your selection.",
        duration: 1500,
      });
    }
    
    // If selecting text-only on premium or growth, this will keep the current tier
    if (value === 'chatbot') {
      console.log('Text-only selected, maintaining current tier:', aiTier);
    }
    
    handleAITypeChange(value);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">AI Type</label>
      <Select 
        value={aiType}
        onValueChange={handleAITypeSelectionChange}
      >
        <SelectTrigger className="calculator-input bg-white">
          <SelectValue placeholder="Select AI Type" />
        </SelectTrigger>
        <SelectContent className="bg-white z-50">
          <SelectItem value="chatbot">Text Only</SelectItem>
          <SelectItem value="voice" disabled={aiTier === 'starter'}>Basic Voice Only</SelectItem>
          <SelectItem value="conversationalVoice" disabled={aiTier !== 'premium'}>Conversational Voice Only</SelectItem>
          <SelectItem value="both" disabled={aiTier === 'starter'}>Text & Basic Voice</SelectItem>
          <SelectItem value="both-premium" disabled={aiTier !== 'premium'}>Text & Conversational Voice</SelectItem>
        </SelectContent>
      </Select>
      
      {aiTier === 'starter' && (
        <p className="text-sm text-amber-600 mt-1">
          Note: Starter Plan only supports text capabilities. Select Growth or Premium Plan for voice.
        </p>
      )}
      
      {(aiType === 'conversationalVoice' || aiType === 'both-premium') && aiTier !== 'premium' && (
        <p className="text-sm text-amber-600 mt-1">
          Conversational Voice AI requires the Premium Plan.
        </p>
      )}
      
      {(aiType === 'conversationalVoice' || aiType === 'both-premium') && aiTier === 'premium' && (
        <p className="text-sm text-green-600 mt-1">
          Conversational Voice AI enabled with your Premium Plan.
        </p>
      )}
      
      {(aiType === 'voice' || aiType === 'both') && aiTier === 'growth' && (
        <p className="text-sm text-green-600 mt-1">
          Basic Voice AI enabled with your Growth Plan.
        </p>
      )}
    </div>
  );
};
