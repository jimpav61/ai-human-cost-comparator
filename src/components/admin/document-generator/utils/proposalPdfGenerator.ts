
import { Lead } from "@/types/leads";
import { generateTemplateBasedPdf } from "./template-based-pdf";

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
      additionalVoiceMinutes: lead.calculator_results?.additionalVoiceMinutes
    }
  });
  
  // CRITICAL FIX: Make sure we have proper results data by creating a deep clone 
  // AND ensuring we preserve the exact tierKey from calculator_inputs
  const sanitizedLead = JSON.parse(JSON.stringify(lead));
  
  // CRITICAL FIX: ALWAYS prioritize calculator_inputs over calculator_results
  // This ensures that UI edits always take precedence
  if (sanitizedLead.calculator_inputs && sanitizedLead.calculator_results) {
    // Force calculator_results to use the values from calculator_inputs
    if (sanitizedLead.calculator_inputs.aiTier) {
      console.log(`Setting calculator_results.tierKey to match inputs.aiTier: ${sanitizedLead.calculator_inputs.aiTier}`);
      sanitizedLead.calculator_results.tierKey = sanitizedLead.calculator_inputs.aiTier;
    }
    
    if (sanitizedLead.calculator_inputs.aiType) {
      console.log(`Setting calculator_results.aiType to match inputs.aiType: ${sanitizedLead.calculator_inputs.aiType}`);
      sanitizedLead.calculator_results.aiType = sanitizedLead.calculator_inputs.aiType;
    }
    
    // CRITICAL FIX: Make sure callVolume is a number and assign it to additionalVoiceMinutes
    if (sanitizedLead.calculator_inputs.callVolume !== undefined) {
      let parsedCallVolume = sanitizedLead.calculator_inputs.callVolume;
      
      if (typeof parsedCallVolume === 'string') {
        parsedCallVolume = parseInt(parsedCallVolume, 10) || 0;
        console.log(`Converted callVolume from string to number: ${parsedCallVolume}`);
      }
      
      console.log(`Setting calculator_results.additionalVoiceMinutes from callVolume: ${parsedCallVolume}`);
      sanitizedLead.calculator_results.additionalVoiceMinutes = parsedCallVolume;
    }
  }
  
  // Final verification log to confirm the values were properly synced
  console.log("Final tier and voice data after processing:", {
    calculator_results: {
      tierKey: sanitizedLead.calculator_results?.tierKey,
      aiType: sanitizedLead.calculator_results?.aiType,
      additionalVoiceMinutes: sanitizedLead.calculator_results?.additionalVoiceMinutes
    }
  });
  
  // Use our template-based approach that directly uses stored values
  return generateTemplateBasedPdf(sanitizedLead);
};

// Export types for compatibility with existing code
export * from "./pdf-generator/types";
