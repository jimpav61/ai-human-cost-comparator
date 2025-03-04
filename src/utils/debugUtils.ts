
import { Lead } from "@/types/leads";
import { LeadChangeLog } from "@/components/calculator/types";

/**
 * Utility to log application initialization for debugging purposes
 */
export const logAppInitialization = () => {
  console.log('APP INITIALIZATION: Application starting to load');
  
  // Log environment information
  console.log('APP INITIALIZATION: Environment:', {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,
    baseUrl: import.meta.env.BASE_URL
  });
  
  // Log browser information
  console.log('APP INITIALIZATION: Browser:', {
    userAgent: navigator.userAgent,
    language: navigator.language,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });
  
  // Return initialization success
  return {
    timestamp: new Date().toISOString(),
    status: 'initialized'
  };
};

/**
 * Utility to log changes made to a lead for debugging purposes
 * @param originalLead The lead before changes
 * @param updatedLead The lead after changes
 * @returns An object containing before, after, and changed fields
 */
export const logLeadChanges = (originalLead: Lead, updatedLead: Lead): LeadChangeLog => {
  const changedFields: string[] = [];
  
  // Basic fields comparison
  const basicFields = ['name', 'company_name', 'email', 'phone_number', 'website', 'industry', 'employee_count'];
  basicFields.forEach(field => {
    if (originalLead[field as keyof Lead] !== updatedLead[field as keyof Lead]) {
      changedFields.push(field);
    }
  });
  
  // Calculator inputs comparison
  if (originalLead.calculator_inputs && updatedLead.calculator_inputs) {
    Object.keys({...originalLead.calculator_inputs, ...updatedLead.calculator_inputs}).forEach(key => {
      if (JSON.stringify(originalLead.calculator_inputs?.[key]) !== JSON.stringify(updatedLead.calculator_inputs?.[key])) {
        changedFields.push(`calculator_inputs.${key}`);
      }
    });
  }
  
  // Log the changes to console
  console.log('LEAD CHANGE LOG:', {
    originalLead,
    updatedLead,
    changedFields
  });
  
  return {
    before: { ...originalLead },
    after: { ...updatedLead },
    changedFields
  };
};

/**
 * Utility to verify if call volume exceeds included minutes
 * @param tier The AI tier (starter, growth, premium)
 * @param callVolume The number of calls
 * @param avgCallDuration The average call duration in minutes
 * @returns Information about voice minute usage
 */
export const verifyVoiceMinuteUsage = (tier: string, callVolume: number, avgCallDuration: number) => {
  const totalMinutes = callVolume * avgCallDuration;
  let includedMinutes = 0;
  
  // Get included minutes based on tier
  if (tier === 'growth' || tier === 'premium') {
    includedMinutes = 600;
  }
  
  const extraMinutes = Math.max(0, totalMinutes - includedMinutes);
  const withinIncludedMinutes = totalMinutes <= includedMinutes;
  
  const result = {
    tier,
    totalMinutes,
    includedMinutes,
    extraMinutes,
    withinIncludedMinutes
  };
  
  console.log('VOICE MINUTE USAGE CHECK:', result);
  
  return result;
};
