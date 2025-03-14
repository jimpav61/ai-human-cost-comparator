
/**
 * PDF Generation Utilities
 * Helper functions to support the PDF generation process
 */

/**
 * Format currency values for PDF display
 */
export function formatPdfCurrency(amount: number | null | undefined): string {
  // Return $0 if amount is null or undefined
  if (amount === null || amount === undefined) {
    return "$0";
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format percentage values for PDF display
 */
export function formatPdfPercentage(value: number | null | undefined): string {
  // Return 0% if value is null or undefined
  if (value === null || value === undefined) {
    return "0%";
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value / 100);
}

/**
 * Format large numbers with separators
 */
export function formatPdfNumber(value: number | null | undefined): string {
  // Return 0 if value is null or undefined
  if (value === null || value === undefined) {
    return "0";
  }
  
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Get plan display name from tier key
 */
export function getPlanName(tierKey: string | null | undefined): string {
  if (!tierKey) return 'Custom Plan';
  
  return tierKey === 'starter' ? 'Starter Plan' : 
         tierKey === 'growth' ? 'Growth Plan' : 
         tierKey === 'premium' ? 'Premium Plan' : 'Custom Plan';
}

/**
 * Get AI type display name from type key
 */
export function getAiTypeDisplay(aiType: string | null | undefined): string {
  if (!aiType) return 'Custom';
  
  return aiType === 'chatbot' ? 'Text Only' : 
         aiType === 'voice' ? 'Basic Voice' : 
         aiType === 'conversationalVoice' ? 'Conversational Voice' : 
         aiType === 'both' ? 'Text & Basic Voice' : 
         aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Custom';
}

/**
 * Verify if a string is a valid PDF (starts with %PDF-)
 */
export function isValidPdf(content: string): boolean {
  return content.startsWith('%PDF-');
}

/**
 * Ensure a number is valid and not NaN
 */
export function ensureNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return defaultValue;
  }
  return Number(value);
}

/**
 * Ensure a string is valid and not empty
 */
export function ensureString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined || typeof value !== 'string') {
    return defaultValue;
  }
  return value;
}

/**
 * Get timestamp formatted for PDF display
 */
export function getFormattedTimestamp(): string {
  const today = new Date();
  return `${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}, ${today.getFullYear()}`;
}

/**
 * Safely escape PDF text to prevent formatting issues
 * Replace characters that could break PDF formatting 
 */
export function escapePdfText(text: string): string {
  if (!text) return '';
  
  // Replace special characters that might break PDF syntax
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, ' ');
}

/**
 * Log data to console with label for improved debugging
 */
export function debugLog(label: string, data: any): void {
  console.log(`[PDF DEBUG] ${label}:`, 
    typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
}
