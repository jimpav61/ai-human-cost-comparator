import { Lead } from "@/types/leads";
import { v4 as uuidv4 } from 'uuid';

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

/**
 * Ensures the lead has a valid UUID
 * If the lead has a temporary ID, it will be replaced with a proper UUID
 */
export const ensureLeadHasValidId = (lead: Lead): Lead => {
  // Check if lead has a valid UUID
  if (!lead.id || lead.id.startsWith('temp-') || lead.id === 'new') {
    return {
      ...lead,
      id: uuidv4()
    };
  }
  return lead;
};

// Other validation utilities can be added here
