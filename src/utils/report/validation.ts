
import { Lead } from "@/types/leads";

/**
 * Creates a safe filename from the lead company name
 * Removes special characters and spaces to create a valid filename
 */
export const getSafeFileName = (lead: Lead): string => {
  // Make sure we have a valid company name for the file
  const companyName = lead.company_name || "Client";
  return companyName.replace(/[^\w\s-]/gi, '') || 'Client';
};
