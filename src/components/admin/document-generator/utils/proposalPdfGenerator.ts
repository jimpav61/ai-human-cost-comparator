
import { Lead } from "@/types/leads";
import { generateTemplateBasedPdf } from "./template-based-pdf";

/**
 * Generates a professional, multi-page proposal PDF with lead data
 * Using exact values from calculator_results without modification
 */
export const generateProposalPdf = (lead: Lead): string => {
  console.log("Generating proposal PDF with template-based approach");
  console.log("Lead data:", lead.id, lead.company_name);
  
  // Use our template-based approach that directly uses stored values
  return generateTemplateBasedPdf(lead);
};

// Export types for compatibility with existing code
export * from "./pdf-generator/types";
