
// Common utility functions for edge functions

/**
 * Formats a currency value with $ sign and 2 decimal places
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Safely extracts a value from an object with fallback
 */
export const safeGet = <T>(obj: any, path: string, defaultValue: T): T => {
  try {
    const value = path.split('.').reduce((o, key) => (o || {})[key], obj);
    return (value !== undefined && value !== null) ? value as T : defaultValue;
  } catch (e) {
    console.error(`Error accessing path ${path}:`, e);
    return defaultValue;
  }
};

/**
 * Gets a safe filename based on a company name
 */
export const getSafeFileName = (companyName: string): string => {
  return companyName ? companyName.replace(/[^\w\s-]/gi, '-').toLowerCase() : 'client';
};
