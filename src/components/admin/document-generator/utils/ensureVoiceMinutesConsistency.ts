
import { Lead } from "@/types/leads";

/**
 * Ensures that voice minutes data is consistent between calculator_inputs and calculator_results
 * This addresses the critical issue with voice minutes not showing up correctly in proposals
 */
export function ensureVoiceMinutesConsistency(lead: Lead): Lead {
  // Create a deep copy to avoid reference issues
  const updatedLead = JSON.parse(JSON.stringify(lead));
  
  // Log the initial state for debugging
  console.log("Voice minutes before consistency check:", {
    inputs_callVolume: updatedLead.calculator_inputs?.callVolume,
    results_additionalVoiceMinutes: updatedLead.calculator_results?.additionalVoiceMinutes,
    tierKey: updatedLead.calculator_results?.tierKey || updatedLead.calculator_inputs?.aiTier,
    input_type: typeof updatedLead.calculator_inputs?.callVolume,
    result_type: typeof updatedLead.calculator_results?.additionalVoiceMinutes
  });

  if (!updatedLead.calculator_inputs) {
    updatedLead.calculator_inputs = {};
  }
  
  if (!updatedLead.calculator_results) {
    updatedLead.calculator_results = {};
  }

  // Determine the tier - first try results, then inputs, fallback to growth
  const tierKey = updatedLead.calculator_results?.tierKey || 
                 updatedLead.calculator_inputs?.aiTier || 
                 'growth';
  
  // For starter tier, always set voice minutes to 0
  if (tierKey === 'starter') {
    updatedLead.calculator_inputs.callVolume = 0;
    updatedLead.calculator_results.additionalVoiceMinutes = 0;
    console.log("Reset voice minutes to 0 for starter plan");
    return updatedLead;
  }
  
  // Get voice minutes from the most reliable source, convert to number
  let voiceMinutes: number = 0;
  
  // First check calculator_inputs.callVolume as primary source
  if (updatedLead.calculator_inputs.callVolume !== undefined) {
    if (typeof updatedLead.calculator_inputs.callVolume === 'string') {
      voiceMinutes = parseInt(updatedLead.calculator_inputs.callVolume, 10) || 0;
    } else {
      voiceMinutes = Number(updatedLead.calculator_inputs.callVolume) || 0;
    }
    console.log("Using callVolume from calculator_inputs:", voiceMinutes);
  }
  // Then check calculator_results.additionalVoiceMinutes as secondary source
  else if (updatedLead.calculator_results.additionalVoiceMinutes !== undefined) {
    if (typeof updatedLead.calculator_results.additionalVoiceMinutes === 'string') {
      voiceMinutes = parseInt(updatedLead.calculator_results.additionalVoiceMinutes, 10) || 0;
    } else {
      voiceMinutes = Number(updatedLead.calculator_results.additionalVoiceMinutes) || 0;
    }
    console.log("Using additionalVoiceMinutes from calculator_results:", voiceMinutes);
  }
  // Default to 0 if neither is available
  else {
    voiceMinutes = 0;
    console.log("No voice minutes found, defaulting to 0");
  }
  
  // Update both locations with the same value to ensure consistency
  updatedLead.calculator_inputs.callVolume = voiceMinutes;
  updatedLead.calculator_results.additionalVoiceMinutes = voiceMinutes;
  
  // Also update the aiCostMonthly voice cost to maintain consistency
  if (updatedLead.calculator_results.aiCostMonthly) {
    // Calculate voice cost at 12 cents per minute
    const voiceCost = voiceMinutes * 0.12;
    updatedLead.calculator_results.aiCostMonthly.voice = voiceCost;
    
    // Recalculate total with updated voice cost
    if (updatedLead.calculator_results.aiCostMonthly.chatbot) {
      const baseCost = updatedLead.calculator_results.aiCostMonthly.chatbot;
      updatedLead.calculator_results.aiCostMonthly.total = baseCost + voiceCost;
    }
  }
  
  // Log the result for debugging
  console.log("Voice minutes after consistency check:", {
    inputs_callVolume: updatedLead.calculator_inputs.callVolume,
    results_additionalVoiceMinutes: updatedLead.calculator_results.additionalVoiceMinutes,
    aiCostMonthly: updatedLead.calculator_results.aiCostMonthly
  });
  
  return updatedLead;
}
