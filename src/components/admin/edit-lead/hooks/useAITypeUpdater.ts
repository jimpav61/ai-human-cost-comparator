
import { useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { CalculatorInputs } from "@/hooks/useCalculator";
import { AI_RATES } from "@/constants/pricing";
import { getTierDisplayName } from "@/components/calculator/pricingDetailsCalculator";

export const useAITypeUpdater = (
  calculatorInputs: CalculatorInputs,
  setCalculatorInputs: React.Dispatch<React.SetStateAction<CalculatorInputs>>,
  setFormData: React.Dispatch<React.SetStateAction<any>>
) => {
  useEffect(() => {
    updateAITypeBasedOnTier(calculatorInputs.aiTier);
  }, []);

  const updateAITypeBasedOnTier = (tier: string) => {
    let newAIType = calculatorInputs.aiType;
    let callVolumeToSet = calculatorInputs.callVolume;
    let tierChanged = false;
    
    if (tier === 'starter') {
      // Downgrade to chatbot and zero out call volume for starter tier
      if (newAIType !== 'chatbot') {
        newAIType = 'chatbot';
        callVolumeToSet = 0;
        tierChanged = true;
      }
    } 
    else if (tier === 'growth') {
      // Downgrade from premium voice features if on growth plan
      if (newAIType === 'conversationalVoice') {
        newAIType = 'voice';
        tierChanged = true;
      } else if (newAIType === 'both-premium') {
        newAIType = 'both';
        tierChanged = true;
      }
      
      // Set default call volume if it was 0
      if (callVolumeToSet === 0) {
        const includedMinutes = AI_RATES.chatbot.growth.includedVoiceMinutes || 600;
        callVolumeToSet = Math.floor(includedMinutes / calculatorInputs.avgCallDuration);
      }
    } 
    else if (tier === 'premium') {
      // Upgrade to premium voice features
      if (newAIType === 'voice') {
        newAIType = 'conversationalVoice';
        tierChanged = true;
      } else if (newAIType === 'both') {
        newAIType = 'both-premium';
        tierChanged = true;
      } else if (newAIType === 'chatbot') {
        // Default to most comprehensive for premium
        newAIType = 'both-premium';
        tierChanged = true;
      }
      
      // Set default call volume for premium tier
      if (callVolumeToSet === 0) {
        const includedMinutes = AI_RATES.chatbot.premium.includedVoiceMinutes || 600;
        callVolumeToSet = Math.floor(includedMinutes / calculatorInputs.avgCallDuration);
      }
    }
    
    if (newAIType !== calculatorInputs.aiType || callVolumeToSet !== calculatorInputs.callVolume) {
      console.log(`Updating AI type from ${calculatorInputs.aiType} to ${newAIType} due to tier change to ${tier}`);
      setCalculatorInputs(prev => ({
        ...prev,
        aiType: newAIType as any,
        callVolume: callVolumeToSet
      }));
      
      setFormData(prev => ({
        ...prev,
        calculator_inputs: {
          ...prev.calculator_inputs,
          aiType: newAIType,
          callVolume: callVolumeToSet
        }
      }));
      
      if (tierChanged) {
        toast({
          title: "AI Type Updated",
          description: `AI capabilities have been ${tier === 'premium' ? 'upgraded' : 'adjusted'} to match the ${getTierDisplayName(tier)} tier.`,
        });
      }
    }
  };
  
  return { updateAITypeBasedOnTier };
};
