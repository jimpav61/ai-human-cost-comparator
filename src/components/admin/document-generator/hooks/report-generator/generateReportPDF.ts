
import { ProcessedLeadData } from "./types";
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';
import { initializeDocument } from "./document/initializeDocument";
import { addDocumentContent } from "./document/addDocumentContent";
import { handleReportErrors } from "./document/handleReportErrors";

export const generateReportPDF = (processedData: ProcessedLeadData): JsPDFWithAutoTable => {
  console.log("Generating PDF report with:", processedData);
  
  try {
    // Initialize the PDF document
    const doc = initializeDocument();
    
    // Add all content to the document
    addDocumentContent(doc, processedData);
    
    return doc;
  } catch (error) {
    return handleReportErrors(error);
  }
};
