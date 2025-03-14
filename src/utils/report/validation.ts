
import { Lead } from "@/types/leads";

/**
 * Creates a safe filename from the lead company name
 * Removes special characters and spaces to create a valid filename
 */
export const getSafeFileName = (lead: Lead): string => {
  // Make sure we have a valid company name for the file
  const companyName = lead.company_name || "Client";
  console.log("Creating safe filename for:", companyName);
  const safeName = companyName.replace(/[^\w\s-]/gi, '');
  console.log("Safe filename created:", safeName);
  return safeName || 'Client';
};

/**
 * Creates a safe filename with more options
 * Use this when more configuration is needed
 */
export const getSafeFileNameWithOptions = (
  input: string | Lead, 
  options: { maxLength?: number, replaceChar?: string } = {}
): string => {
  // Handle different input types
  const stringValue = typeof input === 'string' 
    ? input 
    : (input.company_name || 'Client');
  
  // Default options
  const { maxLength = 40, replaceChar = '-' } = options;
  
  // Replace invalid file name characters with the replacement character
  let safeName = stringValue.replace(/[<>:"\/\\|?*\x00-\x1F]/gi, replaceChar);
  
  // Remove multiple consecutive replacement characters
  safeName = safeName.replace(new RegExp(`${replaceChar}+`, 'g'), replaceChar);
  
  // Trim replacement characters from beginning and end
  safeName = safeName.replace(new RegExp(`^${replaceChar}|${replaceChar}$`, 'g'), '');
  
  // Limit length
  if (safeName.length > maxLength) {
    safeName = safeName.substring(0, maxLength);
  }
  
  // Ensure we don't end with a replacement character
  safeName = safeName.replace(new RegExp(`${replaceChar}$`), '');
  
  return safeName || 'Client';
};
