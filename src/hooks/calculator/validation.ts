
import { CalculatorInputs } from './types';

/**
 * Validate calculator inputs and provide defaults
 */
export function validateInputs(inputs: CalculatorInputs): CalculatorInputs {
  console.log("Validating calculator inputs:", inputs);
  
  // Ensure aiType is consistent with aiTier
  let aiType = inputs.aiType || 'chatbot';
  const aiTier = inputs.aiTier || 'starter';
  
  // Force consistent AI type values based on tier
  if (aiTier === 'starter' && aiType !== 'chatbot') {
    aiType = 'chatbot';
    console.log("Starter plan can only use chatbot - corrected aiType to:", aiType);
  } else if (aiTier === 'premium') {
    if (aiType === 'voice') {
      aiType = 'conversationalVoice';
      console.log("Premium plan upgraded voice to conversational - corrected aiType to:", aiType);
    } else if (aiType === 'both') {
      aiType = 'both-premium';
      console.log("Premium plan upgraded voice features - corrected aiType to:", aiType);
    }
  } else if (aiTier === 'growth') {
    if (aiType === 'conversationalVoice') {
      aiType = 'voice';
      console.log("Growth plan can only use basic voice - corrected aiType to:", aiType);
    } else if (aiType === 'both-premium') {
      aiType = 'both';
      console.log("Growth plan can only use basic voice features - corrected aiType to:", aiType);
    }
  }
  
  // Ensure callVolume is a number
  let callVolume = inputs.callVolume;
  if (typeof callVolume === 'string') {
    callVolume = parseInt(callVolume, 10) || 0;
    console.log("Converted callVolume from string to number:", callVolume);
  } else if (typeof callVolume !== 'number') {
    callVolume = 0;
    console.log("callVolume was not a number or string, set to default:", callVolume);
  }
  
  // Make sure starter plan has 0 call volume
  if (aiTier === 'starter' && callVolume > 0) {
    callVolume = 0;
    console.log("Starter plan cannot have call volume - reset to 0");
  }
  
  const validatedInputs = {
    aiType: aiType,
    aiTier: aiTier,
    role: inputs.role || 'customerService',
    numEmployees: inputs.numEmployees || 5,
    callVolume: callVolume,
    avgCallDuration: 0, // No longer used in calculations
    chatVolume: inputs.chatVolume || 2000,
    avgChatLength: 0, // No longer used in calculations
    avgChatResolutionTime: 0 // No longer used in calculations
  };
  
  console.log("Validated calculator inputs:", validatedInputs);
  return validatedInputs;
}
