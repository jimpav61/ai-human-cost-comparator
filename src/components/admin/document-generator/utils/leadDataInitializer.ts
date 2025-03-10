import { Lead } from "@/types/leads";

/**
 * Initializes the lead data for the report editor, ensuring all required fields exist
 * with proper default values and calculated values where necessary
 */
export function initializeLeadData(lead: Lead): Lead {
  const leadCopy = JSON.parse(JSON.stringify(lead));
  
  if (!leadCopy.calculator_inputs) {
    leadCopy.calculator_inputs = {};
  }
  
  // Keep existing values or set defaults
  leadCopy.calculator_inputs.aiTier = leadCopy.calculator_inputs.aiTier || 'growth';
  leadCopy.calculator_inputs.aiType = leadCopy.calculator_inputs.aiType || 'both';
  
  // Calculate callVolume from either existing calculator_inputs or from calculator_results
  if (typeof leadCopy.calculator_inputs.callVolume === 'number') {
    console.log("Using existing callVolume from inputs:", leadCopy.calculator_inputs.callVolume);
  } 
  else if (leadCopy.calculator_results?.aiCostMonthly?.voice > 0) {
    // Calculate voice minutes from the voice cost (cost is $0.12 per minute)
    const voiceCost = leadCopy.calculator_results.aiCostMonthly.voice;
    const existingCallVolume = Math.round(voiceCost / 0.12);
    
    // Round to nearest 100
    leadCopy.calculator_inputs.callVolume = Math.round(existingCallVolume / 100) * 100;
    console.log("Calculated callVolume from voice cost:", voiceCost, "->", leadCopy.calculator_inputs.callVolume);
  } 
  else {
    leadCopy.calculator_inputs.callVolume = 0;
    console.log("No existing callVolume, defaulting to 0");
  }
  
  return leadCopy;
}
