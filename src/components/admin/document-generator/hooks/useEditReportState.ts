
import { useState, useEffect } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { initializeLeadData } from "../utils/leadDataInitializer";
import { CalculatorInputs } from "@/hooks/calculator/types";

export const useEditReportState = (lead: Lead, onSave: (updatedLead: Lead) => void, onClose: () => void) => {
  // Create a deep copy of the lead to avoid reference issues
  const [editableLead, setEditableLead] = useState<Lead>(() => {
    const initializedLead = initializeLeadData(lead);
    console.log("Initial editable lead state:", initializedLead);
    return initializedLead;
  });

  // Ensure dialog always shows the latest lead data when opened
  useEffect(() => {
    const initializedLead = initializeLeadData(lead);
    console.log("useEffect updating editable lead:", initializedLead);
    console.log("CallVolume from initialized lead:", initializedLead.calculator_inputs?.callVolume);
    setEditableLead(initializedLead);
  }, [lead]);
  
  // Handle changes to the voice minutes input
  const handleCallVolumeChange = (value: string) => {
    console.log("Changing callVolume to:", value);
    // Parse as number and ensure it's a multiple of 100
    let numValue = parseInt(value, 10) || 0;
    numValue = Math.round(numValue / 100) * 100;
    
    setEditableLead(prev => {
      const updated = {
        ...prev,
        calculator_inputs: {
          ...prev.calculator_inputs,
          callVolume: numValue
        }
      };
      console.log("Updated lead with new callVolume:", updated.calculator_inputs.callVolume);
      return updated;
    });
  };
  
  // Handle changes to the AI tier
  const handleAITierChange = (value: string) => {
    if (value !== 'starter' && value !== 'growth' && value !== 'premium') {
      console.error("Invalid AI tier value:", value);
      return;
    }
    
    setEditableLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...prev.calculator_inputs,
        aiTier: value as CalculatorInputs['aiTier']
      }
    }));
  };
  
  // Handle changes to the AI type
  const handleAITypeChange = (value: string) => {
    // Validate the AI type value
    const validAITypes = ['chatbot', 'voice', 'both', 'conversationalVoice', 'both-premium'];
    if (!validAITypes.includes(value)) {
      console.error("Invalid AI type value:", value);
      return;
    }
    
    setEditableLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...prev.calculator_inputs,
        aiType: value as CalculatorInputs['aiType']
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
          aiType: 'chatbot' as const,
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
            aiType: 'conversationalVoice' as const
          };
        } else if (aiType === 'both') {
          updatedLead.calculator_inputs = {
            ...updatedLead.calculator_inputs,
            aiType: 'both-premium' as const
          };
        }
      } else if (aiTier === 'growth') {
        // Ensure basic voice features for growth tier
        if (aiType === 'conversationalVoice') {
          updatedLead.calculator_inputs = {
            ...updatedLead.calculator_inputs,
            aiType: 'voice' as const
          };
        } else if (aiType === 'both-premium') {
          updatedLead.calculator_inputs = {
            ...updatedLead.calculator_inputs,
            aiType: 'both' as const
          };
        }
      }
      
      console.log("Saving lead with callVolume:", updatedLead.calculator_inputs.callVolume);
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
