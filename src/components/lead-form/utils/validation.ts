
// List of common free email domains
export const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
  "live.com",
  "inbox.com",
  "gmx.com",
  "mailinator.com",
  "msn.com"
];

/**
 * Validates if an email is a business email by checking the domain against known free email providers
 */
export const isBusinessEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.includes(domain);
};

/**
 * Validates email format and business domain
 */
export const validateEmail = (email: string): { isValid: boolean; errorMessage: string } => {
  if (!email) {
    return { isValid: false, errorMessage: 'Email is required' };
  }
  
  if (!isBusinessEmail(email)) {
    return { isValid: false, errorMessage: 'Please use a business email address' };
  }
  
  return { isValid: true, errorMessage: '' };
};

/**
 * Validates phone number format
 */
export const validatePhoneFormat = (phone: string): boolean => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  // Check if the phone number has at least 10 digits
  return digitsOnly.length >= 10;
};

/**
 * Validates website URL format
 */
export const validateWebsite = (website: string): { isValid: boolean; errorMessage: string } => {
  if (!website) {
    return { isValid: false, errorMessage: 'Website URL is required' };
  }
  
  const domainPattern = /^(https?:\/\/)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+/;
  if (!domainPattern.test(website)) {
    return { isValid: false, errorMessage: 'Please enter a valid website domain' };
  }
  
  return { isValid: true, errorMessage: '' };
};

/**
 * Normalizes website URL by ensuring it has http/https prefix
 */
export const normalizeWebsiteUrl = (website: string): string => {
  if (!website.startsWith('http://') && !website.startsWith('https://')) {
    return 'https://' + website;
  }
  return website;
};
