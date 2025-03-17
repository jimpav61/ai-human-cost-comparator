
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";

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
      leadCopy.calculator_inputs = {};
    }
    
    // Ensure aiTier has a value
    if (!leadCopy.calculator_inputs.aiTier) {
      leadCopy.calculator_inputs.aiTier = 'growth';
    }
    
    // Ensure aiType has a value
    if (!leadCopy.calculator_inputs.aiType) {
      leadCopy.calculator_inputs.aiType = 'both';
    }
    
    // Ensure callVolume is a number
    const callVolume = leadCopy.calculator_inputs.callVolume;
    if (typeof callVolume === 'string') {
      leadCopy.calculator_inputs.callVolume = parseInt(callVolume, 10) || 0;
    } else if (callVolume === undefined || callVolume === null) {
      leadCopy.calculator_inputs.callVolume = 0;
    }
    
    return leadCopy;
  });
  
  // Handle aiTier change
  const handleAITierChange = (value: string) => {
    console.log("Changing AI tier to:", value);
    setEditableLead(prevLead => {
      const updatedLead = { ...prevLead };
      
      if (!updatedLead.calculator_inputs) {
        updatedLead.calculator_inputs = {};
      }
      
      updatedLead.calculator_inputs.aiTier = value;
      
      // If downgraded to starter, reset voice settings
      if (value === 'starter') {
        updatedLead.calculator_inputs.aiType = 'chatbot';
        updatedLead.calculator_inputs.callVolume = 0;
      }
      
      // If upgraded to premium from a non-premium tier and using voice features
      if (value === 'premium' && prevLead.calculator_inputs?.aiTier !== 'premium') {
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
  
  // Handle aiType change
  const handleAITypeChange = (value: string) => {
    console.log("Changing AI type to:", value);
    setEditableLead(prevLead => {
      const updatedLead = { ...prevLead };
      
      if (!updatedLead.calculator_inputs) {
        updatedLead.calculator_inputs = {};
      }
      
      updatedLead.calculator_inputs.aiType = value;
      
      // Handle tier upgrades based on selected AI type
      if ((value === 'conversationalVoice' || value === 'both-premium') && 
          updatedLead.calculator_inputs.aiTier !== 'premium') {
        updatedLead.calculator_inputs.aiTier = 'premium';
      }
      
      // If voice features selected but on starter plan, upgrade to growth
      if ((value === 'voice' || value === 'both') && 
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
        updatedLead.calculator_inputs = {};
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
