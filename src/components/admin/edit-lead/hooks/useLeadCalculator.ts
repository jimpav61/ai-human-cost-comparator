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
    // Deep clone the lead to avoid reference issues
    const leadClone = JSON.parse(JSON.stringify(lead));
    console.log("INIT useLeadCalculator with lead:", leadClone.id);
    
    // CRITICAL FIX: ALWAYS prioritize calculator_results over calculator_inputs
    // Check if lead has valid calculator_results                      
    const hasValidResults = leadClone.calculator_results && 
                           typeof leadClone.calculator_results === 'object' && 
                           Object.keys(leadClone.calculator_results).length > 0;
    
    if (hasValidResults) {
      console.log("Initializing from calculator_results:", leadClone.calculator_results);
      
      // Extract the tierKey and aiType directly from calculator_results
      const tierKey = leadClone.calculator_results.tierKey || 'growth';
      const aiType = leadClone.calculator_results.aiType || 'both';
      
      // CRITICAL: Extract additional voice minutes from calculator_results
      let additionalVoiceMinutes = 0;
      if ('additionalVoiceMinutes' in leadClone.calculator_results) {
        additionalVoiceMinutes = leadClone.calculator_results.additionalVoiceMinutes;
        console.log("Found additionalVoiceMinutes in results:", additionalVoiceMinutes);
      }
      
      // Create input objects based on the results data
      const inputsFromResults: CalculatorInputs = {
        ...defaultCalculatorInputs,
        aiTier: validateAiTier(tierKey),
        aiType: validateAiType(aiType),
        callVolume: Number(additionalVoiceMinutes) || 0,
        numEmployees: Number(leadClone.employee_count) || defaultCalculatorInputs.numEmployees
      };
      
      console.log("Created calculator inputs from results:", inputsFromResults);
      return inputsFromResults;
    }
    
    // Only fall back to calculator_inputs if no results are available
    const hasValidInputs = leadClone.calculator_inputs && 
                          typeof leadClone.calculator_inputs === 'object' && 
                          Object.keys(leadClone.calculator_inputs).length > 0;
    
    if (hasValidInputs) {
      console.log("Falling back to calculator_inputs:", leadClone.calculator_inputs);
      
      // Get AI type from inputs, ensure it's a valid value
      const aiTypeFromInputs = leadClone.calculator_inputs.aiType as string;
      const validatedAiType = validateAiType(aiTypeFromInputs);
      
      // Get tier from inputs, ensure it's a valid value
      const aiTierFromInputs = leadClone.calculator_inputs.aiTier as string;
      const validatedAiTier = validateAiTier(aiTierFromInputs);
      
      // Ensure callVolume is properly converted to a number
      let callVolume = leadClone.calculator_inputs.callVolume;
      if (typeof callVolume === 'string') {
        callVolume = parseInt(callVolume, 10) || 0;
      } else if (typeof callVolume !== 'number') {
        callVolume = 0;
      }
      
      // Merge with defaults to ensure all properties exist
      const mergedInputs = { 
        ...defaultCalculatorInputs, 
        ...leadClone.calculator_inputs,
        aiType: validatedAiType,
        aiTier: validatedAiTier,
        callVolume: callVolume,
        numEmployees: leadClone.employee_count || defaultCalculatorInputs.numEmployees
      } as CalculatorInputs;
      
      console.log("Initialized calculator inputs from lead inputs:", mergedInputs);
      return mergedInputs;
    }
    
    // If no valid inputs or results, use default inputs with employee count from lead
    const defaultInputs = {
      ...defaultCalculatorInputs,
      numEmployees: leadClone.employee_count || defaultCalculatorInputs.numEmployees
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
      // Ensure callVolume is always a number
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
    // Deep clone the lead to avoid reference issues
    const leadClone = JSON.parse(JSON.stringify(lead));
    console.log("Lead changed in useLeadCalculator:", leadClone.id);
    
    // CRITICAL FIX: ALWAYS prioritize calculator_results over calculator_inputs
    // Check if lead has valid calculator_results                      
    const hasValidResults = leadClone.calculator_results && 
                           typeof leadClone.calculator_results === 'object' && 
                           Object.keys(leadClone.calculator_results).length > 0;
    
    if (hasValidResults) {
      console.log("Updating from calculator_results:", leadClone.calculator_results);
      
      // Extract values directly from calculator_results
      const tierKey = leadClone.calculator_results.tierKey || 'growth';
      const aiType = leadClone.calculator_results.aiType || 'both';
      
      // Extract additional voice minutes from results
      let additionalVoiceMinutes = 0;
      if ('additionalVoiceMinutes' in leadClone.calculator_results) {
        additionalVoiceMinutes = leadClone.calculator_results.additionalVoiceMinutes;
        console.log("Found additionalVoiceMinutes in results:", additionalVoiceMinutes);
      }
      
      // Create calculator inputs from the results
      const inputsFromResults: CalculatorInputs = {
        ...defaultCalculatorInputs,
        aiTier: validateAiTier(tierKey),
        aiType: validateAiType(aiType),
        callVolume: Number(additionalVoiceMinutes) || 0,
        numEmployees: Number(leadClone.employee_count) || defaultCalculatorInputs.numEmployees
      };
      
      console.log("Updated calculator inputs from results:", inputsFromResults);
      setCalculatorInputs(inputsFromResults);
      return;  // Exit early since we've updated from results
    }
    
    // Only fall back to calculator_inputs if no results are available
    const hasValidInputs = leadClone.calculator_inputs && 
                          typeof leadClone.calculator_inputs === 'object' && 
                          Object.keys(leadClone.calculator_inputs).length > 0;
    
    if (hasValidInputs) {
      console.log("Falling back to calculator_inputs:", leadClone.calculator_inputs);
      
      // Get AI type from inputs, ensure it's a valid value
      const aiTypeFromInputs = leadClone.calculator_inputs.aiType as string;
      const validatedAiType = validateAiType(aiTypeFromInputs);
      
      // Get tier from inputs, ensure it's a valid value
      const aiTierFromInputs = leadClone.calculator_inputs.aiTier as string;
      const validatedAiTier = validateAiTier(aiTierFromInputs);
      
      // Ensure callVolume is properly converted to a number
      let callVolume = leadClone.calculator_inputs.callVolume;
      if (typeof callVolume === 'string') {
        callVolume = parseInt(callVolume, 10) || 0;
      } else if (typeof callVolume !== 'number') {
        callVolume = 0;
      }
      
      // Merge with defaults to ensure all properties exist
      const mergedInputs = { 
        ...defaultCalculatorInputs, 
        ...leadClone.calculator_inputs,
        aiType: validatedAiType,
        aiTier: validatedAiTier,
        callVolume: callVolume,
        numEmployees: leadClone.employee_count || defaultCalculatorInputs.numEmployees
      } as CalculatorInputs;
      
      console.log("Updated calculator inputs from lead inputs:", mergedInputs);
      setCalculatorInputs(mergedInputs);
    }
    else {
      // If no valid inputs or results, use default inputs with employee count from lead
      const defaultInputs = {
        ...defaultCalculatorInputs,
        numEmployees: leadClone.employee_count || defaultCalculatorInputs.numEmployees
      };
      
      console.log("Using default inputs:", defaultInputs);
      setCalculatorInputs(defaultInputs);
    }
  }, [lead]);

  return {
    calculatorInputs,
    calculationResults,
    handleCalculatorInputChange
  };
}
