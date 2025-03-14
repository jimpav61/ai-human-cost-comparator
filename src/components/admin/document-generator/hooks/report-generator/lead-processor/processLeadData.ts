
import { Lead } from "@/types/leads";
import { getDisplayNames } from "./displayNames";
import { getSuggestions } from "./suggestions";
import { getCalculatorData } from "./calculatorData";
import { ProcessedLeadData } from "../types";

export const processLeadData = (lead: Lead): ProcessedLeadData => {
  console.log("Processing lead data for report:", lead);

  // Get core calculator data (inputs, results, pricing details)
  const calculatorData = getCalculatorData(lead);
  
  // Get display names for tier and AI type
  const { tierName, aiType } = getDisplayNames(
    calculatorData.tierKey,
    calculatorData.aiTypeToUse
  );
  
  // Get standard suggestions and placements content
  const { businessSuggestions, aiPlacements } = getSuggestions();

  return {
    // Contact and company information
    contactInfo: lead.name || 'Valued Client',
    companyName: lead.company_name || 'Your Company',
    email: lead.email || 'client@example.com',
    phoneNumber: lead.phone_number || '',
    industry: lead.industry || 'Other',
    employeeCount: lead.employee_count || 5,
    
    // Calculator results
    results: calculatorData.safeResults,
    
    // Plan details
    tierName,
    aiType,
    
    // Voice minutes data
    additionalVoiceMinutes: calculatorData.extraVoiceMinutes,
    includedVoiceMinutes: calculatorData.includedVoiceMinutes,
    
    // Content suggestions
    businessSuggestions,
    aiPlacements
  };
};
