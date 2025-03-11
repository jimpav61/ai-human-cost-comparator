
import { useState, useEffect } from "react";
import { Lead } from "@/types/leads";

export const useEditReportState = (
  lead: Lead,
  onSave: (updatedLead: Lead) => void,
  onClose: () => void
) => {
  const [editableLead, setEditableLead] = useState<Lead>({...lead});
  
  // Update the editable lead when the original lead changes
  useEffect(() => {
    setEditableLead({...lead});
  }, [lead]);
  
  // Make sure calculator_inputs exists
  useEffect(() => {
    if (!editableLead.calculator_inputs) {
      setEditableLead(prev => ({
        ...prev,
        calculator_inputs: {
          aiTier: 'growth',
          aiType: 'both',
          callVolume: 0,
          chatVolume: 2000,
          role: 'customerService',
          numEmployees: prev.employee_count || 5,
          avgCallDuration: 0,
          avgChatLength: 0,
          avgChatResolutionTime: 0
        }
      }));
    }
  }, [editableLead]);
  
  // Handle changes to call volume
  const handleCallVolumeChange = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
    
    setEditableLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...prev.calculator_inputs,
        callVolume: numValue
      }
    }));
  };
  
  // Handle changes to AI tier
  const handleAITierChange = (value: string) => {
    const newAiTier = value as 'starter' | 'growth' | 'premium';
    let newAiType = editableLead.calculator_inputs?.aiType || 'both';
    
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
    
    setEditableLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...prev.calculator_inputs,
        aiTier: newAiTier,
        aiType: newAiType,
        // Reset callVolume to 0 for starter tier
        callVolume: newAiTier === 'starter' ? 0 : prev.calculator_inputs?.callVolume || 0
      }
    }));
  };
  
  // Handle changes to AI type
  const handleAITypeChange = (value: string) => {
    const newAiType = value as 'chatbot' | 'voice' | 'both' | 'conversationalVoice' | 'both-premium';
    const currentTier = editableLead.calculator_inputs?.aiTier || 'growth';
    
    setEditableLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...prev.calculator_inputs,
        aiType: newAiType
      }
    }));
  };
  
  // Handle saving changes
  const handleSave = () => {
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
