import { useState, useEffect } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";

export const useEditReportState = (lead: Lead, onSave: (updatedLead: Lead) => void, onClose: () => void) => {
  // Create a deep copy of the lead to avoid reference issues
  const [editableLead, setEditableLead] = useState<Lead>(() => {
    return initializeLeadData(lead);
  });

  // Ensure dialog always shows the latest lead data when opened
  useEffect(() => {
    setEditableLead(initializeLeadData(lead));
  }, [lead]);
  
  // Handle changes to the voice minutes input
  const handleCallVolumeChange = (value: string) => {
    // Parse as number and ensure it's a multiple of 100
    let numValue = parseInt(value, 10) || 0;
    numValue = Math.round(numValue / 100) * 100;
    
    setEditableLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...(prev.calculator_inputs || {}),
        callVolume: numValue
      }
    }));
  };
  
  // Handle changes to the AI tier
  const handleAITierChange = (value: string) => {
    setEditableLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...(prev.calculator_inputs || {}),
        aiTier: value
      }
    }));
  };
  
  // Handle changes to the AI type
  const handleAITypeChange = (value: string) => {
    setEditableLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...(prev.calculator_inputs || {}),
        aiType: value
      }
    }));
  };
  
  // Save changes
  const handleSave = () => {
    try {
      // Validate that AI type is compatible with AI tier
      const aiTier = editableLead.calculator_inputs?.aiTier || 'growth';
      let aiType = editableLead.calculator_inputs?.aiType || 'both';
      
      const updatedLead = { ...editableLead };
      
      if (aiTier === 'starter' && aiType !== 'chatbot') {
        // Force chatbot for starter tier
        updatedLead.calculator_inputs = {
          ...updatedLead.calculator_inputs,
          aiType: 'chatbot',
          callVolume: 0
        };
        toast({
          title: "AI Type Adjusted",
          description: "Starter plan only supports text capabilities. Voice features have been disabled.",
        });
      } else if (aiTier === 'premium') {
        // Ensure premium voice features for premium tier
        if (aiType === 'voice') {
          updatedLead.calculator_inputs = {
            ...updatedLead.calculator_inputs,
            aiType: 'conversationalVoice'
          };
        } else if (aiType === 'both') {
          updatedLead.calculator_inputs = {
            ...updatedLead.calculator_inputs,
            aiType: 'both-premium'
          };
        }
      } else if (aiTier === 'growth') {
        // Ensure basic voice features for growth tier
        if (aiType === 'conversationalVoice') {
          updatedLead.calculator_inputs = {
            ...updatedLead.calculator_inputs,
            aiType: 'voice'
          };
        } else if (aiType === 'both-premium') {
          updatedLead.calculator_inputs = {
            ...updatedLead.calculator_inputs,
            aiType: 'both'
          };
        }
      }
      
      onSave(updatedLead);
      onClose();
      
      toast({
        title: "Report Settings Updated",
        description: "The report settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving report settings:", error);
      toast({
        title: "Error",
        description: "Failed to update report settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    editableLead,
    handleCallVolumeChange,
    handleAITierChange,
    handleAITypeChange,
    handleSave
  };
};

// Helper function to initialize lead data
function initializeLeadData(lead: Lead): Lead {
  const leadCopy = JSON.parse(JSON.stringify(lead));
  
  if (!leadCopy.calculator_inputs) {
    leadCopy.calculator_inputs = {};
  }
  
  // Keep existing values or set defaults
  leadCopy.calculator_inputs.aiTier = leadCopy.calculator_inputs.aiTier || 'growth';
  leadCopy.calculator_inputs.aiType = leadCopy.calculator_inputs.aiType || 'both';
  
  // Calculate callVolume from either existing calculator_inputs or from calculator_results
  if (typeof leadCopy.calculator_inputs.callVolume === 'number') {
    console.log("Using existing callVolume from inputs:", leadCopy.calculator_inputs.callVolume);
  } 
  else if (leadCopy.calculator_results?.aiCostMonthly?.voice > 0) {
    // Calculate voice minutes from the voice cost (cost is $0.12 per minute)
    const voiceCost = leadCopy.calculator_results.aiCostMonthly.voice;
    const existingCallVolume = Math.round(voiceCost / 0.12);
    
    // Round to nearest 100
    leadCopy.calculator_inputs.callVolume = Math.round(existingCallVolume / 100) * 100;
    console.log("Calculated callVolume from voice cost:", voiceCost, "->", leadCopy.calculator_inputs.callVolume);
  } 
  else {
    leadCopy.calculator_inputs.callVolume = 0;
    console.log("No existing callVolume, defaulting to 0");
  }
  
  return leadCopy;
}
