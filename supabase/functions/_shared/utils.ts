
/**
 * Safely formats a currency value with $ symbol, commas, and 2 decimal places
 */
export function formatCurrency(value: number): string {
  try {
    // Ensure value is a valid number
    const num = typeof value === 'number' ? value : 0;
    
    // Format with $ symbol, commas, and fixed 2 decimal places
    return '$' + num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '$0';
  }
}

/**
 * Safely formats a percentage value with % symbol
 */
export function formatPercentage(value: number): string {
  try {
    // Ensure value is a valid number
    const num = typeof value === 'number' ? value : 0;
    
    // Format with % symbol and no decimal places
    return Math.round(num) + '%';
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0%';
  }
}

/**
 * Safely formats a number with commas and optional decimal places
 */
export function formatNumber(value: number, decimalPlaces: number = 0): string {
  try {
    // Ensure value is a valid number
    const num = typeof value === 'number' ? value : 0;
    
    // Format with commas and specified decimal places
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
  } catch (error) {
    console.error('Error formatting number:', error);
    return '0';
  }
}

/**
 * Sanitizes a string for use as a filename
 * @param input The input string to sanitize
 * @param options Optional configuration
 * @returns A safe filename string
 */
export function getSafeFileName(
  input: string, 
  options: { maxLength?: number; replaceChar?: string } = {}
): string {
  // Set default options
  const maxLength = options.maxLength || 50;
  const replaceChar = options.replaceChar || '_';
  
  // Replace invalid characters and trim
  let safeStr = input
    .replace(/[^a-z0-9]/gi, replaceChar) // Replace invalid chars with replacement char
    .replace(new RegExp(`\\${replaceChar}+`, 'g'), replaceChar) // Collapse multiple replacement chars
    .replace(new RegExp(`^\\${replaceChar}|\\${replaceChar}$`, 'g'), ''); // Remove leading/trailing replacement chars
  
  // Truncate if needed
  if (safeStr.length > maxLength) {
    safeStr = safeStr.substring(0, maxLength);
    
    // If truncated at a replacement char, remove it
    if (safeStr.endsWith(replaceChar)) {
      safeStr = safeStr.substring(0, safeStr.length - 1);
    }
  }
  
  return safeStr || 'document'; // Fallback if empty
}
