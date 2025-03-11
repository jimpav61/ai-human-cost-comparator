
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
      const { error } = await supabase
        .from('leads')
        .update({
          calculator_inputs: toJson(updatedLead.calculator_inputs)
        })
        .eq('id', updatedLead.id);
      
      if (error) throw error;
      
      const updatedLeadCopy = {...lead};
      updatedLeadCopy.calculator_inputs = {...updatedLead.calculator_inputs};
      
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
