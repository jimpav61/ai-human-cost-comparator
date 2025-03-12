
import { Lead } from "@/types/leads";
import { generateTemplateBasedPdf } from "./template-based-pdf";

/**
 * Generates a professional, multi-page proposal PDF with lead data
 * Using exact values from calculator_results without modification
 */
export const generateProposalPdf = (lead: Lead): string => {
  console.log("Generating proposal PDF with template-based approach");
  console.log("Lead data:", lead.id, lead.company_name);
  console.log("Lead calculator_results:", lead.calculator_results);
  
  // Make sure we have proper results data by creating a deep clone
  const sanitizedLead = JSON.parse(JSON.stringify(lead));
  
  // Explicitly log the important fields for debugging
  console.log("BEFORE SYNC - aiTier:", sanitizedLead.calculator_inputs?.aiTier);
  console.log("BEFORE SYNC - aiType:", sanitizedLead.calculator_inputs?.aiType);
  console.log("BEFORE SYNC - callVolume:", sanitizedLead.calculator_inputs?.callVolume);
  console.log("BEFORE SYNC - additionalVoiceMinutes:", sanitizedLead.calculator_results?.additionalVoiceMinutes);
  
  // Ensure callVolume is a number
  if (sanitizedLead.calculator_inputs && typeof sanitizedLead.calculator_inputs.callVolume === 'string') {
    sanitizedLead.calculator_inputs.callVolume = parseInt(sanitizedLead.calculator_inputs.callVolume, 10) || 0;
    console.log("Converted callVolume from string to number:", sanitizedLead.calculator_inputs.callVolume);
  }
  
  // Critical fix: Always prioritize calculator_results values for consistency
  if (sanitizedLead.calculator_results && sanitizedLead.calculator_inputs) {
    const tierKey = sanitizedLead.calculator_results.tierKey;
    const aiType = sanitizedLead.calculator_results.aiType;
    
    if (tierKey && sanitizedLead.calculator_inputs.aiTier !== tierKey) {
      console.log(`Syncing calculator_inputs.aiTier (${sanitizedLead.calculator_inputs.aiTier}) to match results.tierKey (${tierKey})`);
      sanitizedLead.calculator_inputs.aiTier = tierKey;
    }
    
    if (aiType && sanitizedLead.calculator_inputs.aiType !== aiType) {
      console.log(`Syncing calculator_inputs.aiType (${sanitizedLead.calculator_inputs.aiType}) to match results.aiType (${aiType})`);
      sanitizedLead.calculator_inputs.aiType = aiType;
    }
    
    // CRITICAL FIX: Ensure additionalVoiceMinutes in results is aligned with callVolume in inputs
    // This is key to fixing the PDF generation issues with voice minutes
    if ('additionalVoiceMinutes' in sanitizedLead.calculator_results) {
      const additionalVoiceMinutes = sanitizedLead.calculator_results.additionalVoiceMinutes || 0;
      if (sanitizedLead.calculator_inputs.callVolume !== additionalVoiceMinutes) {
        // We prioritize the value in calculator_results over calculator_inputs
        console.log(`Syncing calculator_inputs.callVolume (${sanitizedLead.calculator_inputs.callVolume}) to match results.additionalVoiceMinutes (${additionalVoiceMinutes})`);
        sanitizedLead.calculator_inputs.callVolume = additionalVoiceMinutes;
      }
    }
    // If no additionalVoiceMinutes in results, copy it from callVolume
    else if ('callVolume' in sanitizedLead.calculator_inputs) {
      console.log(`Setting missing additionalVoiceMinutes from callVolume (${sanitizedLead.calculator_inputs.callVolume})`);
      sanitizedLead.calculator_results.additionalVoiceMinutes = sanitizedLead.calculator_inputs.callVolume;
    }
  }
  
  console.log("AFTER SYNC - aiTier:", sanitizedLead.calculator_inputs?.aiTier);
  console.log("AFTER SYNC - aiType:", sanitizedLead.calculator_inputs?.aiType);
  console.log("AFTER SYNC - callVolume:", sanitizedLead.calculator_inputs?.callVolume);
  console.log("AFTER SYNC - additionalVoiceMinutes:", sanitizedLead.calculator_results?.additionalVoiceMinutes);
  
  // Use our template-based approach that directly uses stored values
  return generateTemplateBasedPdf(sanitizedLead);
};

// Export types for compatibility with existing code
export * from "./pdf-generator/types";
