
import { Lead } from "@/types/leads";
import { CalculatorInputs } from "@/hooks/calculator/types";

export function initializeLeadData(lead: Lead): Lead {
  console.log("Initializing lead data for report editor:", lead);
  console.log("Initial calculator_inputs:", lead.calculator_inputs);
  
  // Create a deep clone to avoid reference issues
  const leadCopy: Lead = JSON.parse(JSON.stringify(lead));
  
  if (!leadCopy.calculator_inputs) {
    leadCopy.calculator_inputs = {} as CalculatorInputs;
  }
  
  // Keep existing values or set defaults
  leadCopy.calculator_inputs.aiTier = leadCopy.calculator_inputs.aiTier || 'growth';
  leadCopy.calculator_inputs.aiType = leadCopy.calculator_inputs.aiType || 'both';
  
  // Ensure callVolume is properly initialized
  if (typeof leadCopy.calculator_inputs.callVolume === 'string') {
    // Convert string to number
    const callVolumeNumber = parseInt(leadCopy.calculator_inputs.callVolume, 10);
    leadCopy.calculator_inputs.callVolume = !isNaN(callVolumeNumber) ? callVolumeNumber : 0;
    console.log("Converted callVolume from string to number:", leadCopy.calculator_inputs.callVolume);
  } else if (leadCopy.calculator_inputs.callVolume === undefined || 
             leadCopy.calculator_inputs.callVolume === null) {
    // If missing, try to extract from results or default to 0
    if (leadCopy.calculator_results?.aiCostMonthly?.voice > 0) {
      // Calculate voice minutes from the voice cost (cost is $0.12 per minute)
      const voiceCost = leadCopy.calculator_results.aiCostMonthly.voice;
      let existingCallVolume = Math.round(voiceCost / 0.12);
      
      // Round to nearest 100
      existingCallVolume = Math.round(existingCallVolume / 100) * 100;
      
      leadCopy.calculator_inputs.callVolume = existingCallVolume;
      console.log("Calculated callVolume from voice cost:", voiceCost, "->", leadCopy.calculator_inputs.callVolume);
    } else {
      leadCopy.calculator_inputs.callVolume = 0;
      console.log("No existing callVolume, defaulting to 0");
    }
  }
  
  // Fix for 'standard' tier which should be mapped to 'growth'
  if (leadCopy.calculator_inputs.aiTier === 'standard') {
    leadCopy.calculator_inputs.aiTier = 'growth';
    console.log("Fixed 'standard' tier to 'growth'");
  }
  
  console.log("Lead initialized with callVolume:", leadCopy.calculator_inputs.callVolume);
  return leadCopy;
}
