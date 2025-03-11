
import { useState, useEffect } from "react";
import { Lead } from "@/types/leads";

export const useEditReportState = (
  lead: Lead,
  onSave: (updatedLead: Lead) => void,
  onClose: () => void
) => {
  // Create deep copy of lead to avoid reference issues
  const [editableLead, setEditableLead] = useState<Lead>(() => {
    const leadCopy = JSON.parse(JSON.stringify(lead));
    
    // Make sure calculator_inputs exists and has correct values
    if (!leadCopy.calculator_inputs) {
      leadCopy.calculator_inputs = {
        aiTier: 'growth',
        aiType: 'both',
        callVolume: 0,
        chatVolume: 2000,
        role: 'customerService',
        numEmployees: leadCopy.employee_count || 5,
        avgCallDuration: 0,
        avgChatLength: 0,
        avgChatResolutionTime: 0
      };
    }
    
    // Ensure callVolume is a number
    if (typeof leadCopy.calculator_inputs.callVolume === 'string') {
      leadCopy.calculator_inputs.callVolume = parseInt(leadCopy.calculator_inputs.callVolume, 10) || 0;
    }
    
    return leadCopy;
  });
  
  // Update the editable lead when the original lead changes
  useEffect(() => {
    console.log("useEditReportState: lead prop changed");
    console.log("New lead aiTier:", lead.calculator_inputs?.aiTier);
    console.log("New lead aiType:", lead.calculator_inputs?.aiType);
    console.log("New lead callVolume:", lead.calculator_inputs?.callVolume);
    
    const leadCopy = JSON.parse(JSON.stringify(lead));
    
    // Make sure calculator_inputs exists
    if (!leadCopy.calculator_inputs) {
      leadCopy.calculator_inputs = {
        aiTier: 'growth',
        aiType: 'both',
        callVolume: 0,
        chatVolume: 2000,
        role: 'customerService',
        numEmployees: leadCopy.employee_count || 5,
        avgCallDuration: 0,
        avgChatLength: 0,
        avgChatResolutionTime: 0
      };
    }
    
    // Ensure callVolume is a number
    if (typeof leadCopy.calculator_inputs.callVolume === 'string') {
      leadCopy.calculator_inputs.callVolume = parseInt(leadCopy.calculator_inputs.callVolume, 10) || 0;
    }
    
    setEditableLead(leadCopy);
  }, [lead]);
  
  // Handle changes to call volume
  const handleCallVolumeChange = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
    console.log("Setting callVolume to:", numValue);
    
    setEditableLead(prev => {
      // Create deep copy to avoid reference issues
      const updated = JSON.parse(JSON.stringify(prev));
      
      // Update the callVolume
      if (!updated.calculator_inputs) {
        updated.calculator_inputs = {};
      }
      updated.calculator_inputs.callVolume = numValue;
      
      return updated;
    });
  };
  
  // Handle changes to AI tier
  const handleAITierChange = (value: string) => {
    const newAiTier = value as 'starter' | 'growth' | 'premium';
    console.log("Setting aiTier to:", newAiTier);
    
    setEditableLead(prev => {
      // Create deep copy to avoid reference issues
      const updated = JSON.parse(JSON.stringify(prev));
      
      if (!updated.calculator_inputs) {
        updated.calculator_inputs = {};
      }
      
      // Get current AI type
      let newAiType = updated.calculator_inputs.aiType || 'both';
      
      // Ensure AI type is compatible with the selected tier
      if (newAiTier === 'starter' && newAiType !== 'chatbot') {
        newAiType = 'chatbot';
      } else if (newAiTier === 'premium') {
        if (newAiType === 'voice') {
          newAiType = 'conversationalVoice';
        } else if (newAiType === 'both') {
          newAiType = 'both-premium';
        }
      } else if (newAiTier === 'growth') {
        if (newAiType === 'conversationalVoice') {
          newAiType = 'voice';
        } else if (newAiType === 'both-premium') {
          newAiType = 'both';
        }
      }
      
      // Update tier and type
      updated.calculator_inputs.aiTier = newAiTier;
      updated.calculator_inputs.aiType = newAiType;
      
      // Reset callVolume to 0 for starter tier since it doesn't support voice
      if (newAiTier === 'starter') {
        updated.calculator_inputs.callVolume = 0;
      }
      
      return updated;
    });
  };
  
  // Handle changes to AI type
  const handleAITypeChange = (value: string) => {
    const newAiType = value as 'chatbot' | 'voice' | 'both' | 'conversationalVoice' | 'both-premium';
    console.log("Setting aiType to:", newAiType);
    
    setEditableLead(prev => {
      // Create deep copy to avoid reference issues
      const updated = JSON.parse(JSON.stringify(prev));
      
      if (!updated.calculator_inputs) {
        updated.calculator_inputs = {};
      }
      
      updated.calculator_inputs.aiType = newAiType;
      
      return updated;
    });
  };
  
  // Handle saving changes
  const handleSave = () => {
    console.log("Saving changes:", editableLead);
    onSave(editableLead);
  };
  
  return {
    editableLead,
    handleCallVolumeChange,
    handleAITierChange,
    handleAITypeChange,
    handleSave
  };
};
