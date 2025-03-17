
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
  
  // Log for debugging
  console.log("Generating proposal with parameters:", {
    companyName: pdfParams.companyName,
    contactName: pdfParams.contactName,
    aiTier: pdfParams.aiTier,
    aiType: pdfParams.aiType,
    callVolume: pdfParams.callVolume
  });
  
  // Generate the PDF content
  return generatePdfContent(pdfParams);
};

// Export types for use elsewhere
export * from "./types";
