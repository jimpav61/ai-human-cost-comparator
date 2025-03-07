
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
    
    // Try to infer calculator inputs from calculator_results if available
    if (hasValidResults) {
      const results = lead.calculator_results as any;
      if (results.basePriceMonthly) {
        // Determine tier from base price
        let detectedTier: 'starter' | 'growth' | 'premium' = 'starter';
        
        // Map the base price to tier
        if (results.basePriceMonthly === 229) {
          detectedTier = 'growth';
        } else if (results.basePriceMonthly === 429) {
          detectedTier = 'premium';
        } else if (results.basePriceMonthly === 99) {
          detectedTier = 'starter';
        }
        
        console.log("Detected tier from base price:", detectedTier, "Base price:", results.basePriceMonthly);
        
        // Determine appropriate AI type based on tier and voice costs
        let detectedAiType: 'chatbot' | 'voice' | 'both' | 'conversationalVoice' | 'both-premium' = 'chatbot';
        
        // If there are voice costs, determine the AI type accordingly
        if (results.aiCostMonthly && results.aiCostMonthly.voice > 0) {
          // If premium tier, use premium voice capabilities
          if (detectedTier === 'premium') {
            detectedAiType = 'both-premium';
          } else if (detectedTier === 'growth') {
            detectedAiType = 'both';
          }
        } else {
          // No voice costs - use chatbot for starter, and tier-appropriate defaults for others
          if (detectedTier === 'growth') {
            detectedAiType = 'both';
          } else if (detectedTier === 'premium') {
            detectedAiType = 'both-premium';
          } else {
            detectedAiType = 'chatbot';
          }
        }
        
        // Get chat volume and voice volume if available
        const chatVolume = results.chatVolume || defaultCalculatorInputs.chatVolume;
        const callVolume = results.aiCostMonthly && results.aiCostMonthly.voice > 0 
          ? Math.ceil(results.aiCostMonthly.voice / 0.12) // Calculate call volume from voice cost
          : 0;
        
        // Update inputs with the detected values
        const updatedInputs: CalculatorInputs = {
          ...defaultCalculatorInputs,
          aiTier: detectedTier,
          aiType: detectedAiType,
          numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees,
          chatVolume: chatVolume,
          callVolume: callVolume
        };
        
        console.log("Detected inputs from results:", updatedInputs);
        return updatedInputs;
      }
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
    
    // Ensure we always have valid calculator inputs when lead changes
    if (hasValidInputs) {
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
    } else if (hasValidResults) {
      // If no calculator_inputs but we have results, try to determine tier from base price
      const results = lead.calculator_results as any;
      if (results.basePriceMonthly) {
        // Determine tier from base price
        let detectedTier: 'starter' | 'growth' | 'premium' = 'starter';
        
        // Map the base price to tier
        if (results.basePriceMonthly === 229) {
          detectedTier = 'growth';
        } else if (results.basePriceMonthly === 429) {
          detectedTier = 'premium';
        } else if (results.basePriceMonthly === 99) {
          detectedTier = 'starter';
        }
        
        console.log("Lead change: Detected tier from base price:", detectedTier, "Base price:", results.basePriceMonthly);
        
        // Determine appropriate AI type based on tier and voice costs
        let detectedAiType: 'chatbot' | 'voice' | 'both' | 'conversationalVoice' | 'both-premium' = 'chatbot';
        
        // If there are voice costs, determine the AI type accordingly
        if (results.aiCostMonthly && results.aiCostMonthly.voice > 0) {
          // If premium tier, use premium voice capabilities
          if (detectedTier === 'premium') {
            detectedAiType = 'both-premium';
          } else if (detectedTier === 'growth') {
            detectedAiType = 'both';
          }
        } else {
          // No voice costs - use chatbot for starter, and tier-appropriate defaults for others
          if (detectedTier === 'growth') {
            detectedAiType = 'both';
          } else if (detectedTier === 'premium') {
            detectedAiType = 'both-premium';
          } else {
            detectedAiType = 'chatbot';
          }
        }
        
        // Get chat volume and voice volume if available
        const chatVolume = results.chatVolume || defaultCalculatorInputs.chatVolume;
        const callVolume = results.aiCostMonthly && results.aiCostMonthly.voice > 0 
          ? Math.ceil(results.aiCostMonthly.voice / 0.12) // Calculate call volume from voice cost
          : 0;
        
        // Update inputs with the detected values
        const updatedInputs: CalculatorInputs = {
          ...defaultCalculatorInputs,
          aiTier: detectedTier,
          aiType: detectedAiType,
          numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees,
          chatVolume: chatVolume,
          callVolume: callVolume
        };
        
        console.log("Lead change: Detected inputs from results:", updatedInputs);
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
