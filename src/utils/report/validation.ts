
import { v4 as uuidv4 } from 'uuid';
import { Lead } from "@/types/leads";

/**
 * Utility function to sanitize company name for use in filenames
 */
export const getSafeFileName = (lead: any, options: { maxLength?: number, replaceChar?: string } = {}) => {
  const { maxLength = 30, replaceChar = '_' } = options;
  
  // Get company name or fallback
  const companyName = (typeof lead === 'string') 
    ? lead 
    : (lead?.company_name || 'client');
  
  // Sanitize by removing special characters and truncating
  const sanitized = companyName
    .replace(/[^a-zA-Z0-9]/g, replaceChar)
    .toLowerCase()
    .substring(0, maxLength);
  
  // Add date for uniqueness
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  return `${sanitized}_proposal_${timestamp}`;
};

/**
 * Validates whether a filename is safe for use in the filesystem
 */
export const isValidFileName = (filename: string): boolean => {
  // Check for invalid characters in filenames
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
  return !invalidChars.test(filename) && filename.length > 0 && filename.length < 255;
};

/**
 * Ensures calculator inputs are valid to prevent errors
 */
export const validateCalculatorInputs = (inputs: any): boolean => {
  if (!inputs || typeof inputs !== 'object') {
    return false;
  }
  
  // Check for required fields
  const requiredFields = ['aiTier', 'aiType'];
  return requiredFields.every(field => field in inputs);
};

/**
 * Ensures a lead has a valid UUID
 * If the lead has a temporary ID (starting with 'temp-'), this function
 * replaces it with a valid UUID to ensure compatibility with storage systems
 */
export const ensureLeadHasValidId = (lead: Lead): Lead => {
  // If lead doesn't have an ID or has a temporary ID, generate a UUID
  if (!lead.id || lead.id.startsWith('temp-')) {
    // Create a copy of the lead to avoid mutating the original
    const validatedLead = { ...lead };
    validatedLead.id = uuidv4();
    return validatedLead;
  }
  
  // If ID is already valid, return the lead as is
  return lead;
};
