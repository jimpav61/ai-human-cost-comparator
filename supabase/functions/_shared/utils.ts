
/**
 * Format a number as currency with "$" prefix
 */
export function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Format a number with commas for thousands
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Sanitize a filename to remove invalid characters
 */
export function getSafeFileName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}
