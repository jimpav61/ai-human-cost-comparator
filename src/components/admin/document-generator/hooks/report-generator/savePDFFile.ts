
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';
import { Lead } from "@/types/leads";
import { getReportFileName } from "./fileNameUtils";

/**
 * Saves the generated PDF document to the user's device
 */
export const saveReportPDF = (doc: JsPDFWithAutoTable, lead: Lead): void => {
  const fileName = getReportFileName(lead);
  console.log("Document generated, saving as:", fileName);
  
  // Save the document with proper company name
  doc.save(fileName);
};
