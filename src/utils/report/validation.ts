
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
