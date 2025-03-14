
// Utility functions shared across edge functions

// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Get a safe filename from a potentially unsafe string
 */
export function getSafeFileName(input: string | { company_name?: string }, options: { maxLength?: number, replaceChar?: string } = {}): string {
  // Default options
  const { maxLength = 40, replaceChar = '-' } = options;
  
  // Handle object input (extract company_name)
  let str = typeof input === 'object' ? (input.company_name || 'Proposal') : input;
  
  // Replace invalid file name characters with the replacement character
  let safeName = str.replace(/[<>:"\/\\|?*\x00-\x1F]/g, replaceChar);
  
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
  
  // Add timestamp for uniqueness
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  
  return `${safeName}-Proposal-${timestamp}`;
}
