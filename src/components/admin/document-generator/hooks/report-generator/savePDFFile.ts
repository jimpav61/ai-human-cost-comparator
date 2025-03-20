
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';
import { Lead } from "@/types/leads";
import { getReportFileName } from "./fileNameUtils";

/**
 * Saves the generated PDF document to the user's device
 */
export const saveReportPDF = (doc: JsPDFWithAutoTable, lead: Lead): void => {
  const fileName = getReportFileName(lead);
  
  // Enhanced logging to debug voice minutes issue
  console.log("Document generated, saving as:", fileName);
  console.log("Lead tier and voice data:", {
    tierKey: lead.calculator_results?.tierKey || lead.calculator_inputs?.aiTier,
    aiType: lead.calculator_results?.aiType || lead.calculator_inputs?.aiType,
    callVolume: lead.calculator_inputs?.callVolume,
    additionalVoiceMinutes: lead.calculator_results?.additionalVoiceMinutes
  });
  
  // Save the document with proper company name
  doc.save(fileName);
  
  // Log successful download
  console.log(`✅ Report PDF for ${lead.company_name} saved successfully as "${fileName}"`);
};
