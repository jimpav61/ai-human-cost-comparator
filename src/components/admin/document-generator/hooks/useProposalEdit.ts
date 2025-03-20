
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toJson } from "@/hooks/calculator/supabase-types";

export const useProposalEdit = (lead: Lead, onLeadUpdated?: (updatedLead: Lead) => void) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  
  const handleSaveProposalSettings = async (updatedLead: Lead) => {
    try {
      console.log("Saving proposal settings with voice minutes:", updatedLead.calculator_inputs?.callVolume);
      
      // Ensure calculator_inputs.callVolume is a number
      if (updatedLead.calculator_inputs && typeof updatedLead.calculator_inputs.callVolume === 'string') {
        updatedLead.calculator_inputs.callVolume = parseInt(updatedLead.calculator_inputs.callVolume, 10) || 0;
      }
      
      // Ensure calculator_results.additionalVoiceMinutes matches callVolume
      if (updatedLead.calculator_results && updatedLead.calculator_inputs) {
        updatedLead.calculator_results.additionalVoiceMinutes = updatedLead.calculator_inputs.callVolume;
        
        // Update voice cost and total cost
        if (updatedLead.calculator_results.aiCostMonthly) {
          const voiceMinutes = updatedLead.calculator_inputs.callVolume || 0;
          const voiceCost = voiceMinutes * 0.12;
          updatedLead.calculator_results.aiCostMonthly.voice = voiceCost;
          
          // Update total cost
          if (updatedLead.calculator_results.aiCostMonthly.chatbot) {
            const baseCost = updatedLead.calculator_results.aiCostMonthly.chatbot;
            updatedLead.calculator_results.aiCostMonthly.total = baseCost + voiceCost;
          }
        }
      }
      
      const { error } = await supabase
        .from('leads')
        .update({
          calculator_inputs: toJson(updatedLead.calculator_inputs)
        })
        .eq('id', updatedLead.id);
      
      if (error) throw error;
      
      // Create a deep copy to avoid reference issues
      const updatedLeadCopy = JSON.parse(JSON.stringify(lead));
      
      // Update only calculator_inputs and calculator_results
      updatedLeadCopy.calculator_inputs = updatedLead.calculator_inputs;
      
      // If calculator_results exists, update it to match calculator_inputs
      if (updatedLeadCopy.calculator_results) {
        if (updatedLead.calculator_inputs) {
          updatedLeadCopy.calculator_results.additionalVoiceMinutes = updatedLead.calculator_inputs.callVolume;
          updatedLeadCopy.calculator_results.tierKey = updatedLead.calculator_inputs.aiTier;
          updatedLeadCopy.calculator_results.aiType = updatedLead.calculator_inputs.aiType;
        }
        
        // Update voices costs
        if (updatedLeadCopy.calculator_results.aiCostMonthly) {
          const voiceMinutes = updatedLead.calculator_inputs?.callVolume || 0;
          const voiceCost = voiceMinutes * 0.12;
          updatedLeadCopy.calculator_results.aiCostMonthly.voice = voiceCost;
          
          // Update total cost
          if (updatedLeadCopy.calculator_results.aiCostMonthly.chatbot) {
            const baseCost = updatedLeadCopy.calculator_results.aiCostMonthly.chatbot;
            updatedLeadCopy.calculator_results.aiCostMonthly.total = baseCost + voiceCost;
          }
        }
      }
      
      console.log("Updated lead saved:", updatedLeadCopy);
      
      if (onLeadUpdated) {
        onLeadUpdated(updatedLeadCopy);
      }
      
      toast({
        title: "Success",
        description: "Proposal settings updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating proposal settings:", error);
      toast({
        title: "Error",
        description: `Failed to update proposal settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  return {
    isDialogOpen,
    handleOpenDialog,
    handleCloseDialog,
    handleSaveProposalSettings
  };
};
