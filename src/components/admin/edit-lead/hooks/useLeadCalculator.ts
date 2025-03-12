
import { useState, useEffect } from 'react';
import { useCalculator, type CalculatorInputs } from "@/hooks/useCalculator";
import { Lead } from "@/types/leads";

// Helper function to validate aiType
function validateAiType(aiType: string): 'chatbot' | 'voice' | 'both' | 'conversationalVoice' | 'both-premium' {
  const validTypes = ['chatbot', 'voice', 'both', 'conversationalVoice', 'both-premium'];
  return validTypes.includes(aiType) 
    ? aiType as 'chatbot' | 'voice' | 'both' | 'conversationalVoice' | 'both-premium'
    : 'chatbot';
}

// Helper function to validate aiTier
function validateAiTier(aiTier: string): 'starter' | 'growth' | 'premium' {
  const validTiers = ['starter', 'growth', 'premium'];
  return validTiers.includes(aiTier)
    ? aiTier as 'starter' | 'growth' | 'premium' 
    : 'starter';
}

// Default calculator inputs
const defaultCalculatorInputs: CalculatorInputs = {
  aiType: 'chatbot',
  aiTier: 'starter',
  role: 'customerService',
  numEmployees: 5,
  callVolume: 0,
  avgCallDuration: 0, // Keep for backward compatibility but no longer used
  chatVolume: 2000,
  avgChatLength: 0, // Keep for backward compatibility but no longer used
  avgChatResolutionTime: 0 // Keep for backward compatibility but no longer used
};

export function useLeadCalculator(lead: Lead) {
  // Ensure we have valid calculator inputs by merging defaults with lead data if available
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>(() => {
    // Check if lead has valid calculator_inputs
    const hasValidInputs = lead.calculator_inputs && 
                          typeof lead.calculator_inputs === 'object' && 
                          Object.keys(lead.calculator_inputs).length > 0;
    
    // Check if lead has valid calculator_results                      
    const hasValidResults = lead.calculator_results && 
                           typeof lead.calculator_results === 'object' && 
                           Object.keys(lead.calculator_results).length > 0;
    
    console.log("Initializing calculator: hasValidInputs=", hasValidInputs, "hasValidResults=", hasValidResults);
    console.log("Lead calculator_inputs:", lead.calculator_inputs);
    console.log("Lead calculator_results:", lead.calculator_results);
    
    if (hasValidInputs) {
      // Get AI type from inputs, ensure it's a valid value
      const aiTypeFromInputs = lead.calculator_inputs.aiType as string;
      const validatedAiType = validateAiType(aiTypeFromInputs);
      
      // Get tier from inputs, ensure it's a valid value
      const aiTierFromInputs = lead.calculator_inputs.aiTier as string;
      const validatedAiTier = validateAiTier(aiTierFromInputs);
      
      // CRITICAL FIX: Ensure callVolume is properly converted to a number
      let callVolume = lead.calculator_inputs.callVolume;
      if (typeof callVolume === 'string') {
        callVolume = parseInt(callVolume, 10) || 0;
      } else if (typeof callVolume !== 'number') {
        callVolume = 0;
      }
      
      // Merge with defaults to ensure all properties exist
      const mergedInputs = { 
        ...defaultCalculatorInputs, 
        ...lead.calculator_inputs,
        aiType: validatedAiType,
        aiTier: validatedAiTier,
        callVolume: callVolume, // Use the properly converted callVolume
        numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
      } as CalculatorInputs;
      
      console.log("Initialized calculator inputs from lead:", mergedInputs);
      return mergedInputs;
    }
    
    // If we don't have calculator_inputs, try to extract values from calculator_results
    if (hasValidResults) {
      // IMPORTANT CHANGE: Extract values from calculator_results
      const results = lead.calculator_results;
      
      // Get tier directly from results when available
      const tierKey = results.tierKey || 'growth';
      const aiType = results.aiType || 'both';
      
      // CRITICAL FIX: Extract additional voice minutes from results
      const additionalVoiceMinutes = results.additionalVoiceMinutes || 0;
      
      // Create calculator inputs from the results
      const inputsFromResults: CalculatorInputs = {
        ...defaultCalculatorInputs,
        aiTier: validateAiTier(tierKey),
        aiType: validateAiType(aiType),
        callVolume: additionalVoiceMinutes, // Use additionalVoiceMinutes as callVolume
        numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
      };
      
      console.log("Constructed calculator inputs from results:", inputsFromResults);
      return inputsFromResults;
    }
    
    // If no valid inputs or results, use default inputs with employee count from lead
    const defaultInputs = {
      ...defaultCalculatorInputs,
      numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
    };
    
    console.log("Using default inputs:", defaultInputs);
    return defaultInputs;
  });

  // Use the calculator hook to get calculation results
  const calculationResults = useCalculator(calculatorInputs);

  // Handle changes to calculator inputs
  const handleCalculatorInputChange = (field: string, value: any) => {
    console.log(`Changing calculator input ${field} to:`, value);
    
    if (field === 'aiType') {
      value = validateAiType(value);
    } else if (field === 'aiTier') {
      value = validateAiTier(value);
    } else if (field === 'callVolume') {
      // CRITICAL FIX: Ensure callVolume is always a number
      if (typeof value === 'string') {
        value = parseInt(value, 10) || 0;
      } else if (typeof value !== 'number') {
        value = 0;
      }
    }
    
    setCalculatorInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update calculator inputs when lead changes
  useEffect(() => {
    console.log("Lead changed in useLeadCalculator:", lead);
    
    // Check if lead has valid calculator_inputs
    const hasValidInputs = lead.calculator_inputs && 
                          typeof lead.calculator_inputs === 'object' && 
                          Object.keys(lead.calculator_inputs).length > 0;
    
    // Check if lead has valid calculator_results                      
    const hasValidResults = lead.calculator_results && 
                           typeof lead.calculator_results === 'object' && 
                           Object.keys(lead.calculator_results).length > 0;
    
    console.log("Lead change: hasValidInputs=", hasValidInputs, "hasValidResults=", hasValidResults);
    
    if (hasValidInputs) {
      // Get AI type from inputs, ensure it's a valid value
      const aiTypeFromInputs = lead.calculator_inputs.aiType as string;
      const validatedAiType = validateAiType(aiTypeFromInputs);
      
      // Get tier from inputs, ensure it's a valid value
      const aiTierFromInputs = lead.calculator_inputs.aiTier as string;
      const validatedAiTier = validateAiTier(aiTierFromInputs);
      
      // CRITICAL FIX: Ensure callVolume is properly converted to a number
      let callVolume = lead.calculator_inputs.callVolume;
      if (typeof callVolume === 'string') {
        callVolume = parseInt(callVolume, 10) || 0;
      } else if (typeof callVolume !== 'number') {
        callVolume = 0;
      }
      
      // FIX: If we have calculator_results, check if it has additionalVoiceMinutes
      // and use that value if calculator_inputs.callVolume is missing or zero
      if (hasValidResults && lead.calculator_results.additionalVoiceMinutes && 
          (!callVolume || callVolume === 0)) {
        callVolume = lead.calculator_results.additionalVoiceMinutes;
        console.log("Using additionalVoiceMinutes from calculator_results:", callVolume);
      }
      
      // Merge with defaults to ensure all properties exist
      const mergedInputs: CalculatorInputs = { 
        ...defaultCalculatorInputs, 
        ...lead.calculator_inputs,
        aiType: validatedAiType,
        aiTier: validatedAiTier,
        callVolume: callVolume, // Use the properly converted callVolume
        numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
      };
      
      console.log("Updated calculator inputs from lead change:", mergedInputs);
      setCalculatorInputs(mergedInputs);
    } 
    // If no valid calculator inputs but we have results
    else if (hasValidResults) {
      // IMPORTANT CHANGE: Extract values from calculator_results
      const results = lead.calculator_results;
      
      // Get tier directly from results when available
      const tierKey = results.tierKey || 'growth';
      const aiType = results.aiType || 'both';
      
      // CRITICAL FIX: Extract additional voice minutes from results
      const additionalVoiceMinutes = results.additionalVoiceMinutes || 0;
      
      // Create calculator inputs from the results
      const inputsFromResults: CalculatorInputs = {
        ...defaultCalculatorInputs,
        aiTier: validateAiTier(tierKey),
        aiType: validateAiType(aiType),
        callVolume: additionalVoiceMinutes, // Use additionalVoiceMinutes as callVolume
        numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
      };
      
      console.log("Constructed calculator inputs from results:", inputsFromResults);
      setCalculatorInputs(inputsFromResults);
    }
    else {
      // If no valid inputs or results, use default inputs with employee count from lead
      setCalculatorInputs({
        ...defaultCalculatorInputs,
        numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
      });
    }
  }, [lead]);

  return {
    calculatorInputs,
    calculationResults,
    handleCalculatorInputChange
  };
}
