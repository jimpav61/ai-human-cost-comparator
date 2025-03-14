
/**
 * PDF Generation Utilities
 * Helper functions to support the PDF generation process
 */

/**
 * Format currency values for PDF display
 */
export function formatPdfCurrency(amount: number): string {
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
export function formatPdfPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value / 100);
}

/**
 * Format large numbers with separators
 */
export function formatPdfNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Get plan display name from tier key
 */
export function getPlanName(tierKey: string): string {
  return tierKey === 'starter' ? 'Starter Plan' : 
         tierKey === 'growth' ? 'Growth Plan' : 
         tierKey === 'premium' ? 'Premium Plan' : 'Custom Plan';
}

/**
 * Get AI type display name from type key
 */
export function getAiTypeDisplay(aiType: string): string {
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
 * Get timestamp formatted for PDF display
 */
export function getFormattedTimestamp(): string {
  const today = new Date();
  return `${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}, ${today.getFullYear()}`;
}
