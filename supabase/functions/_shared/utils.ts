
/**
 * Formats a number as currency
 * @param value The number to format
 * @returns A formatted currency string
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === undefined || value === null) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formats a number with commas for thousands
 * @param value The number to format
 * @returns A formatted number string
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === undefined || value === null) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Sanitizes a string for use in a filename
 * @param name The string to sanitize
 * @returns A safe filename string
 */
export function getSafeFileName(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 50);
}
