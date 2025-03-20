
import { Lead } from "@/types/leads";
import { generateTemplateBasedPdf } from "./template-based-pdf";
import { ensureVoiceMinutesConsistency } from "./ensureVoiceMinutesConsistency";

/**
 * Generates a professional, multi-page proposal PDF with lead data
 * Using exact values from calculator_results without modification
 */
export const generateProposalPdf = (lead: Lead): string => {
  console.log("Generating proposal PDF with template-based approach");
  console.log("Lead data:", lead.id, lead.company_name);
  
  // CRITICAL FIX: Enhanced logging to trace the tier and minutes values
  console.log("Tier and voice data before processing:", {
    calculator_inputs: {
      aiTier: lead.calculator_inputs?.aiTier,
      aiType: lead.calculator_inputs?.aiType,
      callVolume: lead.calculator_inputs?.callVolume,
      typeOf_callVolume: typeof lead.calculator_inputs?.callVolume
    },
    calculator_results: {
      tierKey: lead.calculator_results?.tierKey,
      aiType: lead.calculator_results?.aiType,
      additionalVoiceMinutes: lead.calculator_results?.additionalVoiceMinutes,
      typeOf_additionalVoiceMinutes: typeof lead.calculator_results?.additionalVoiceMinutes
    }
  });
  
  // CRITICAL FIX: Create a deep copy of the lead to work with
  let processedLead = JSON.parse(JSON.stringify(lead));
  
  // Ensure calculator_inputs exists
  if (!processedLead.calculator_inputs) {
    processedLead.calculator_inputs = {};
  }
  
  // Ensure calculator_results exists
  if (!processedLead.calculator_results) {
    processedLead.calculator_results = {};
  }
  
  // CRITICAL FIX: Direct fix for voice minutes before consistency check
  const tierKey = processedLead.calculator_results?.tierKey || 
                 processedLead.calculator_inputs?.aiTier || 
                 'growth';
  
  // For starter tier, force voice minutes to 0
  if (tierKey === 'starter') {
    processedLead.calculator_inputs.callVolume = 0;
    processedLead.calculator_results.additionalVoiceMinutes = 0;
    console.log("Forced voice minutes to 0 for starter plan");
  } 
  // For other tiers, ensure voice minutes is a number and exists in both places
  else {
    // Get voice minutes value, prioritizing inputs
    let voiceMinutes: number = 0;
    
    if (processedLead.calculator_inputs.callVolume !== undefined) {
      // Convert to number if it's a string
      if (typeof processedLead.calculator_inputs.callVolume === 'string') {
        voiceMinutes = parseInt(processedLead.calculator_inputs.callVolume, 10) || 0;
      } else {
        voiceMinutes = Number(processedLead.calculator_inputs.callVolume) || 0;
      }
      console.log("Using callVolume from inputs:", voiceMinutes);
    }
    // Fallback to results if not in inputs
    else if (processedLead.calculator_results.additionalVoiceMinutes !== undefined) {
      if (typeof processedLead.calculator_results.additionalVoiceMinutes === 'string') {
        voiceMinutes = parseInt(processedLead.calculator_results.additionalVoiceMinutes, 10) || 0;
      } else {
        voiceMinutes = Number(processedLead.calculator_results.additionalVoiceMinutes) || 0;
      }
      console.log("Using additionalVoiceMinutes from results:", voiceMinutes);
    }
    
    // Set both values to ensure consistency
    processedLead.calculator_inputs.callVolume = voiceMinutes;
    processedLead.calculator_results.additionalVoiceMinutes = voiceMinutes;
    
    // Update voice cost in calculator results
    if (processedLead.calculator_results.aiCostMonthly) {
      const voiceCost = voiceMinutes * 0.12;
      processedLead.calculator_results.aiCostMonthly.voice = voiceCost;
      
      // Update total cost
      if (processedLead.calculator_results.aiCostMonthly.chatbot) {
        const baseCost = processedLead.calculator_results.aiCostMonthly.chatbot;
        processedLead.calculator_results.aiCostMonthly.total = baseCost + voiceCost;
      }
    }
  }
  
  // Now run through the consistency check for additional safety
  processedLead = ensureVoiceMinutesConsistency(processedLead);
  
  // Log the final values before generating PDF
  console.log("Final values for PDF generation:", {
    calculator_inputs: {
      aiTier: processedLead.calculator_inputs?.aiTier,
      callVolume: processedLead.calculator_inputs?.callVolume
    },
    calculator_results: {
      tierKey: processedLead.calculator_results?.tierKey,
      additionalVoiceMinutes: processedLead.calculator_results?.additionalVoiceMinutes,
      voiceCost: processedLead.calculator_results?.aiCostMonthly?.voice,
      totalCost: processedLead.calculator_results?.aiCostMonthly?.total
    }
  });
  
  // Generate the PDF with consistent data
  return generateTemplateBasedPdf(processedLead);
};
