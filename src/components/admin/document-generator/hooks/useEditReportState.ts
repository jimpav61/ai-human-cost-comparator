
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { CalculatorInputs } from "@/hooks/calculator/types";

export function useEditReportState(
  initialLead: Lead,
  onSave: (updatedLead: Lead) => void,
  onClose: () => void
) {
  // Deep clone lead to avoid reference issues
  const [editableLead, setEditableLead] = useState<Lead>(() => {
    const leadCopy = JSON.parse(JSON.stringify(initialLead));
    
    // Ensure calculator_inputs exists
    if (!leadCopy.calculator_inputs) {
      leadCopy.calculator_inputs = {
        aiTier: 'growth' as const,
        aiType: 'both' as const,
        role: 'customerService' as const,
        numEmployees: leadCopy.employee_count || 5,
        callVolume: 0,
        avgCallDuration: 0,
        chatVolume: 2000,
        avgChatLength: 0,
        avgChatResolutionTime: 0
      };
    }
    
    // Ensure aiTier has a valid value
    if (!leadCopy.calculator_inputs.aiTier) {
      leadCopy.calculator_inputs.aiTier = 'growth';
    } else if (typeof leadCopy.calculator_inputs.aiTier === 'string' && 
               !['starter', 'growth', 'premium'].includes(leadCopy.calculator_inputs.aiTier)) {
      leadCopy.calculator_inputs.aiTier = 'growth';
    }
    
    // Ensure aiType has a valid value
    if (!leadCopy.calculator_inputs.aiType) {
      leadCopy.calculator_inputs.aiType = 'both';
    } else if (typeof leadCopy.calculator_inputs.aiType === 'string' && 
               !['chatbot', 'voice', 'both', 'conversationalVoice', 'both-premium'].includes(leadCopy.calculator_inputs.aiType)) {
      leadCopy.calculator_inputs.aiType = 'both';
    }
    
    // Ensure callVolume is a number
    const callVolume = leadCopy.calculator_inputs.callVolume;
    if (typeof callVolume === 'string') {
      leadCopy.calculator_inputs.callVolume = parseInt(callVolume, 10) || 0;
    } else if (callVolume === undefined || callVolume === null) {
      leadCopy.calculator_inputs.callVolume = 0;
    }
    
    // Ensure other required fields exist with default values
    if (!leadCopy.calculator_inputs.role) {
      leadCopy.calculator_inputs.role = 'customerService';
    }
    
    if (!leadCopy.calculator_inputs.numEmployees) {
      leadCopy.calculator_inputs.numEmployees = leadCopy.employee_count || 5;
    }
    
    if (!leadCopy.calculator_inputs.chatVolume) {
      leadCopy.calculator_inputs.chatVolume = 2000;
    }
    
    return leadCopy;
  });
  
  // Handle aiTier change with proper type handling
  const handleAITierChange = (value: string) => {
    console.log("Changing AI tier to:", value);
    setEditableLead(prevLead => {
      const updatedLead = { ...prevLead };
      
      if (!updatedLead.calculator_inputs) {
        updatedLead.calculator_inputs = {
          aiTier: 'growth' as const,
          aiType: 'both' as const,
          role: 'customerService' as const,
          numEmployees: updatedLead.employee_count || 5,
          callVolume: 0,
          avgCallDuration: 0,
          chatVolume: 2000,
          avgChatLength: 0,
          avgChatResolutionTime: 0
        };
      }
      
      // Type assertion to ensure it's a valid aiTier value
      const validTier = (['starter', 'growth', 'premium'].includes(value)) ? 
        value as 'starter' | 'growth' | 'premium' : 'growth';
        
      updatedLead.calculator_inputs.aiTier = validTier;
      
      // If downgraded to starter, reset voice settings
      if (validTier === 'starter') {
        updatedLead.calculator_inputs.aiType = 'chatbot';
        updatedLead.calculator_inputs.callVolume = 0;
      }
      
      // If upgraded to premium from a non-premium tier and using voice features
      if (validTier === 'premium' && prevLead.calculator_inputs?.aiTier !== 'premium') {
        const currentAiType = updatedLead.calculator_inputs.aiType;
        if (currentAiType === 'voice') {
          updatedLead.calculator_inputs.aiType = 'conversationalVoice';
        } else if (currentAiType === 'both') {
          updatedLead.calculator_inputs.aiType = 'both-premium';
        }
      }
      
      return updatedLead;
    });
  };
  
  // Handle aiType change with proper type handling
  const handleAITypeChange = (value: string) => {
    console.log("Changing AI type to:", value);
    setEditableLead(prevLead => {
      const updatedLead = { ...prevLead };
      
      if (!updatedLead.calculator_inputs) {
        updatedLead.calculator_inputs = {
          aiTier: 'growth' as const,
          aiType: 'both' as const,
          role: 'customerService' as const,
          numEmployees: updatedLead.employee_count || 5,
          callVolume: 0,
          avgCallDuration: 0,
          chatVolume: 2000,
          avgChatLength: 0,
          avgChatResolutionTime: 0
        };
      }
      
      // Type assertion to ensure it's a valid aiType value
      const validType = (['chatbot', 'voice', 'both', 'conversationalVoice', 'both-premium'].includes(value)) ? 
        value as 'chatbot' | 'voice' | 'both' | 'conversationalVoice' | 'both-premium' : 'both';
        
      updatedLead.calculator_inputs.aiType = validType;
      
      // Handle tier upgrades based on selected AI type
      if ((validType === 'conversationalVoice' || validType === 'both-premium') && 
          updatedLead.calculator_inputs.aiTier !== 'premium') {
        updatedLead.calculator_inputs.aiTier = 'premium';
      }
      
      // If voice features selected but on starter plan, upgrade to growth
      if ((validType === 'voice' || validType === 'both') && 
          updatedLead.calculator_inputs.aiTier === 'starter') {
        updatedLead.calculator_inputs.aiTier = 'growth';
      }
      
      return updatedLead;
    });
  };
  
  // Handle callVolume change
  const handleCallVolumeChange = (value: number) => {
    console.log("Changing call volume to:", value);
    setEditableLead(prevLead => {
      const updatedLead = { ...prevLead };
      
      if (!updatedLead.calculator_inputs) {
        updatedLead.calculator_inputs = {
          aiTier: 'growth' as const,
          aiType: 'both' as const,
          role: 'customerService' as const,
          numEmployees: updatedLead.employee_count || 5,
          callVolume: 0,
          avgCallDuration: 0,
          chatVolume: 2000,
          avgChatLength: 0,
          avgChatResolutionTime: 0
        };
      }
      
      // Store as number
      updatedLead.calculator_inputs.callVolume = value;
      
      return updatedLead;
    });
  };
  
  // Handle save
  const handleSave = () => {
    // Preserve all client contact information
    const updatedLead = { ...editableLead };
    
    console.log("Saving edited lead:", updatedLead);
    onSave(updatedLead);
    onClose();
    
    toast({
      title: "Success",
      description: "Proposal settings updated successfully",
      variant: "default"
    });
  };
  
  return {
    editableLead,
    handleAITierChange,
    handleAITypeChange,
    handleCallVolumeChange,
    handleSave
  };
}
