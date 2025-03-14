
/**
 * Enhanced utility functions for formatting and sanitizing values
 */

/**
 * Formats a number as currency with configurable options
 * @param value The number to format
 * @param options Optional configuration for currency formatting
 * @returns A formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined, 
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    currency?: string;
  }
): string {
  if (value === undefined || value === null) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: options?.currency || 'USD',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2
  }).format(value);
}

/**
 * Formats a number with commas for thousands with configurable options
 * @param value The number to format
 * @param options Optional configuration for number formatting
 * @returns A formatted number string
 */
export function formatNumber(
  value: number | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  if (value === undefined || value === null) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0
  }).format(value);
}

/**
 * Sanitizes a string for use in a filename with additional options
 * @param name The string to sanitize
 * @param options Optional configuration for filename sanitization
 * @returns A safe filename string
 */
export function getSafeFileName(
  name: string,
  options?: {
    maxLength?: number;
    replaceChar?: string;
  }
): string {
  const replaceChar = options?.replaceChar || '_';
  const maxLength = options?.maxLength || 50;
  
  return name
    .replace(/[^a-z0-9]/gi, replaceChar)
    .toLowerCase()
    .substring(0, maxLength);
}

/**
 * Formats a percentage value
 * @param value The percentage value (0-100)
 * @returns A formatted percentage string
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value / 100);
}
