
import { Lead } from "@/types/leads";
import { extractLeadData } from "./extractLeadData";
import { generatePdfContent } from "./pdfStructure";

/**
 * Generates a professional, multi-page proposal PDF with lead data
 * Using exact values from calculator_results without modification
 */
export const generateProposalPdf = (lead: Lead): string => {
  // Extract all necessary data from the lead
  const pdfParams = extractLeadData(lead);
  
  // Generate the PDF content
  return generatePdfContent(pdfParams);
};

// Export types for use elsewhere
export * from "./types";
