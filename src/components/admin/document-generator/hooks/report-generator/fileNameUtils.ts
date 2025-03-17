
import { Lead } from "@/types/leads";

/**
 * Sanitize the company name for use in a filename
 */
export function getSafeFileName(lead: Lead): string {
  // Extract company name or use default
  const companyName = lead.company_name || "Unknown-Company";
  
  // Sanitize company name for filenames
  const safeCompanyName = companyName
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with dash
    .replace(/-+/g, '-')            // Remove multiple consecutive dashes
    .replace(/^-|-$/g, '')          // Remove leading or trailing dashes
    .substring(0, 50);              // Limit length to 50 chars
  
  // If tier is available, include it in filename
  const tier = lead.calculator_inputs?.aiTier || 
               lead.calculator_results?.tierKey || 
               "unspecified";
  
  // Include today's date
  const date = new Date().toISOString().split('T')[0];
  
  // Return formatted name with leadId for uniqueness
  return `${safeCompanyName}-${tier}-${date}-${lead.id.substring(0,8)}`;
}

/**
 * Get the proper report file name that includes lead info
 */
export function getReportFileName(lead: Lead): string {
  // Get the sanitized base filename
  const baseFileName = getSafeFileName(lead);
  
  // Return with pdf extension
  return `${baseFileName}-Report.pdf`;
}
