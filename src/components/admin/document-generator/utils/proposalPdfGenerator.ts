
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
      additionalVoiceMinutes: lead.calculator_results?.additionalVoiceMinutes
    }
  });
  
  // CRITICAL FIX: Ensure voice minutes are consistent
  const processedLead = ensureVoiceMinutesConsistency(lead);
  
  // Generate the PDF with consistent data
  return generateTemplateBasedPdf(processedLead);
};
