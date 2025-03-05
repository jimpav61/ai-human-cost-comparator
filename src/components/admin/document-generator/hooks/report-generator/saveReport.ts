
import { Lead } from "@/types/leads";
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';

export const getSafeFileName = (lead: Lead): string => {
  // Make sure we have a valid company name for the file
  return lead.company_name ? lead.company_name.replace(/[^\w\s-]/gi, '') : 'Client';
};

export const saveReportPDF = (doc: JsPDFWithAutoTable, lead: Lead): void => {
  const safeCompanyName = getSafeFileName(lead);
  console.log("Document generated, saving as:", `${safeCompanyName}-Report.pdf`);
  
  // Save the document with proper company name
  doc.save(`${safeCompanyName}-Report.pdf`);
};
