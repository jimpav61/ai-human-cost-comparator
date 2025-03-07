
import { useState } from "react";
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useLeadEditing(onLeadUpdated?: () => void) {
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleOpenEditDialog = (lead: Lead) => {
    console.log("Opening edit dialog for lead:", lead);
    
    // Ensure calculator_inputs and calculator_results are objects, not null
    const preparedLead: Lead = {
      ...lead,
      calculator_inputs: lead.calculator_inputs || {},
      calculator_results: lead.calculator_results || {}
    };
    
    setEditingLead(preparedLead);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    console.log("Closing edit dialog");
    setIsEditDialogOpen(false);
    setEditingLead(null);
  };

  const handleSaveLead = async (updatedLead: Lead) => {
    console.log("Saving lead:", updatedLead);
    try {
      // Update the lead in the database
      const { error } = await supabase
        .from('leads')
        .update({
          name: updatedLead.name,
          company_name: updatedLead.company_name,
          email: updatedLead.email,
          phone_number: updatedLead.phone_number,
          industry: updatedLead.industry,
          employee_count: updatedLead.employee_count,
          website: updatedLead.website,
          calculator_inputs: updatedLead.calculator_inputs,
          calculator_results: updatedLead.calculator_results
        })
        .eq('id', updatedLead.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Lead updated successfully",
        variant: "default",
      });
      
      // Call the onLeadUpdated callback if provided
      if (onLeadUpdated) {
        onLeadUpdated();
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: `Failed to update lead: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return {
    editingLead,
    isEditDialogOpen,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleSaveLead
  };
}
