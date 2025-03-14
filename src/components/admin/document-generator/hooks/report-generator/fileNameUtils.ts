
import { Lead } from "@/types/leads";

/**
 * Creates a safe filename from the lead company name
 * Removes special characters and spaces to create a valid filename
 */
export const getSafeFileName = (lead: Lead): string => {
  // Make sure we have a valid company name for the file
  return lead.company_name ? lead.company_name.replace(/[^\w\s-]/gi, '') : 'Client';
};

/**
 * Generates the complete filename for the report PDF
 */
export const getReportFileName = (lead: Lead): string => {
  const safeCompanyName = getSafeFileName(lead);
  return `${safeCompanyName}-ChatSites-ROI-Report.pdf`;
};
