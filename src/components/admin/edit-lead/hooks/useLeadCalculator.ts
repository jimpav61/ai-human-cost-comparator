
import { useState, useEffect, useCallback } from 'react';
import { useCalculator } from "@/hooks/useCalculator";
import type { CalculatorInputs } from "@/hooks/calculator/types";
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
  avgCallDuration: 0,
  chatVolume: 2000,
  avgChatLength: 0,
  avgChatResolutionTime: 0
};

export function useLeadCalculator(lead: Lead) {
  // Initialize state with properly processed inputs
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>(() => {
    // Start with a deep clone of the lead to avoid reference issues
    const leadClone = JSON.parse(JSON.stringify(lead));
    
    // Extract key values with proper defaults
    const aiTier = leadClone.calculator_results?.tierKey || 
                  leadClone.calculator_inputs?.aiTier || 
                  'growth';
                  
    const aiType = leadClone.calculator_results?.aiType || 
                  leadClone.calculator_inputs?.aiType || 
                  'both';
                  
    const callVolume = Number(leadClone.calculator_results?.additionalVoiceMinutes || 
                             leadClone.calculator_inputs?.callVolume || 
                             0);
                             
    const chatVolume = Number(leadClone.calculator_inputs?.chatVolume || 2000);
    
    const numEmployees = Number(leadClone.employee_count || 5);
    
    // Create initial state with validated values
    return {
      ...defaultCalculatorInputs,
      aiTier: validateAiTier(aiTier),
      aiType: validateAiType(aiType),
      callVolume: callVolume,
      chatVolume: chatVolume,
      numEmployees: numEmployees
    };
  });

  // Use the calculator hook to get calculation results
  const calculationResults = useCalculator(calculatorInputs);

  // Create a stable callback for handling input changes
  const handleCalculatorInputChange = useCallback((field: keyof CalculatorInputs, value: any) => {
    setCalculatorInputs(prev => {
      const updatedInputs = { ...prev };
      
      // Handle special field logic
      if (field === 'aiType') {
        updatedInputs[field] = validateAiType(value);
      } 
      else if (field === 'aiTier') {
        const newTier = validateAiTier(value);
        updatedInputs[field] = newTier;
        
        // Handle tier-specific logic
        if (newTier === 'starter') {
          updatedInputs.aiType = 'chatbot';
          updatedInputs.callVolume = 0;
        }
        else if (newTier === 'premium') {
          if (prev.aiType === 'voice') {
            updatedInputs.aiType = 'conversationalVoice';
          }
          else if (prev.aiType === 'both') {
            updatedInputs.aiType = 'both-premium';
          }
        }
        else if (newTier === 'growth') {
          if (prev.aiType === 'conversationalVoice') {
            updatedInputs.aiType = 'voice';
          }
          else if (prev.aiType === 'both-premium') {
            updatedInputs.aiType = 'both';
          }
        }
      }
      else if (field === 'callVolume') {
        // Ensure callVolume is always a number
        updatedInputs[field] = typeof value === 'string' ? (parseInt(value, 10) || 0) : value;
      }
      else if (field === 'numEmployees') {
        // Ensure numEmployees is always a number
        updatedInputs[field] = typeof value === 'string' ? (parseInt(value, 10) || 1) : value;
      }
      else if (field === 'chatVolume') {
        // Ensure chatVolume is always a number
        updatedInputs[field] = typeof value === 'string' ? (parseInt(value, 10) || 0) : value;
      }
      else if (Object.prototype.hasOwnProperty.call(prev, field)) {
        // For all other fields that exist in the calculatorInputs type, set the value directly
        (updatedInputs as any)[field] = value;
      }
      // We don't handle unknown fields to avoid the 'never' type error
      
      return updatedInputs;
    });
  }, []);

  // Update inputs when lead changes, but only for initialization
  useEffect(() => {
    const leadClone = JSON.parse(JSON.stringify(lead));
    
    // Only update when the lead ID changes to avoid re-rendering issues
    setCalculatorInputs(prev => {
      if (prev.numEmployees === Number(leadClone.employee_count)) {
        return prev; // Don't update if employee count is the same
      }
      
      return {
        ...prev,
        numEmployees: Number(leadClone.employee_count || 5)
      };
    });
  }, [lead.id, lead.employee_count]);

  return {
    calculatorInputs,
    calculationResults,
    handleCalculatorInputChange
  };
}
