
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
      console.log("Updated plan tier:", updatedLead.calculator_inputs?.aiTier);
      console.log("Updated AI type:", updatedLead.calculator_inputs?.aiType);
      
      // Ensure calculator_inputs.callVolume is a number
      if (updatedLead.calculator_inputs && typeof updatedLead.calculator_inputs.callVolume === 'string') {
        updatedLead.calculator_inputs.callVolume = parseInt(updatedLead.calculator_inputs.callVolume, 10) || 0;
      }
      
      // Save the updated calculator inputs to the database
      const { error } = await supabase
        .from('leads')
        .update({
          calculator_inputs: toJson(updatedLead.calculator_inputs),
          calculator_results: toJson(updatedLead.calculator_results)
        })
        .eq('id', updatedLead.id);
      
      if (error) throw error;
      
      console.log("Updated lead saved:", updatedLead);
      
      if (onLeadUpdated) {
        onLeadUpdated(updatedLead);
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
