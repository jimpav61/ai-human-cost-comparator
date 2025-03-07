
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
    if (lead.calculator_inputs && typeof lead.calculator_inputs === 'object') {
      // Get AI type from inputs, ensure it's a valid value
      const aiTypeFromInputs = lead.calculator_inputs.aiType as string;
      const validatedAiType = validateAiType(aiTypeFromInputs);
      
      // Get tier from inputs, ensure it's a valid value
      const aiTierFromInputs = lead.calculator_inputs.aiTier as string;
      const validatedAiTier = validateAiTier(aiTierFromInputs);
      
      // Merge with defaults to ensure all properties exist
      const mergedInputs = { 
        ...defaultCalculatorInputs, 
        ...lead.calculator_inputs,
        aiType: validatedAiType,
        aiTier: validatedAiTier,
        numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
      } as CalculatorInputs;
      
      console.log("Initialized calculator inputs from lead:", mergedInputs);
      return mergedInputs;
    }
    
    // Check if we can get the tier from calculator_results if calculator_inputs is empty
    if (lead.calculator_results && typeof lead.calculator_results === 'object') {
      const results = lead.calculator_results as any;
      if (results.basePriceMonthly) {
        // Determine tier from base price
        let detectedTier: 'starter' | 'growth' | 'premium' = 'starter';
        if (results.basePriceMonthly === 229) {
          detectedTier = 'growth';
        } else if (results.basePriceMonthly === 429) {
          detectedTier = 'premium';
        }
        
        // Determine appropriate AI type based on tier
        let detectedAiType: 'chatbot' | 'both' | 'both-premium' = 'chatbot';
        if (detectedTier === 'growth') {
          detectedAiType = 'both';
        } else if (detectedTier === 'premium') {
          detectedAiType = 'both-premium';
        } else {
          detectedAiType = 'chatbot';
        }
        
        // Update default inputs with the detected tier
        const updatedInputs: CalculatorInputs = {
          ...defaultCalculatorInputs,
          aiTier: detectedTier,
          aiType: detectedAiType,
          numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
        };
        
        console.log("Detected tier from results:", detectedTier, "Updated inputs:", updatedInputs);
        return updatedInputs;
      }
    }
    
    // If no valid inputs or results, use default inputs with employee count from lead
    const defaultInputs = {
      ...defaultCalculatorInputs,
      numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
    };
    
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
    }
    
    setCalculatorInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update calculator inputs when lead changes
  useEffect(() => {
    console.log("Lead changed in useLeadCalculator:", lead);
    
    // Ensure we always have valid calculator inputs when lead changes
    if (lead.calculator_inputs && typeof lead.calculator_inputs === 'object') {
      const aiTypeFromInputs = lead.calculator_inputs.aiType as string;
      const validatedAiType = validateAiType(aiTypeFromInputs);
      
      const aiTierFromInputs = lead.calculator_inputs.aiTier as string;
      const validatedAiTier = validateAiTier(aiTierFromInputs);
      
      const mergedInputs: CalculatorInputs = { 
        ...defaultCalculatorInputs, 
        ...lead.calculator_inputs,
        aiType: validatedAiType,
        aiTier: validatedAiTier,
        numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
      };
      
      console.log("Updated calculator inputs from lead change:", mergedInputs);
      setCalculatorInputs(mergedInputs);
    } else if (lead.calculator_results && typeof lead.calculator_results === 'object') {
      // If no calculator_inputs but we have results, try to determine tier from base price
      const results = lead.calculator_results as any;
      if (results.basePriceMonthly) {
        // Determine tier from base price
        let detectedTier: 'starter' | 'growth' | 'premium' = 'starter';
        if (results.basePriceMonthly === 229) {
          detectedTier = 'growth';
        } else if (results.basePriceMonthly === 429) {
          detectedTier = 'premium';
        }
        
        // Determine appropriate AI type based on tier
        let detectedAiType: 'chatbot' | 'both' | 'both-premium' = 'chatbot';
        if (detectedTier === 'growth') {
          detectedAiType = 'both';
        } else if (detectedTier === 'premium') {
          detectedAiType = 'both-premium';
        } else {
          detectedAiType = 'chatbot';
        }
        
        // Update inputs with the detected tier
        const updatedInputs: CalculatorInputs = {
          ...defaultCalculatorInputs,
          aiTier: detectedTier,
          aiType: detectedAiType,
          numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
        };
        
        console.log("Lead change: Detected tier from results:", detectedTier, "Updated inputs:", updatedInputs);
        setCalculatorInputs(updatedInputs);
      } else {
        setCalculatorInputs({
          ...defaultCalculatorInputs,
          numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
        });
      }
    } else {
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
