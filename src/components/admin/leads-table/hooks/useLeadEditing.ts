
import { useState } from "react";
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useLeadEditing(onLeadUpdated?: () => void) {
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleOpenEditDialog = (lead: Lead) => {
    console.log("Opening edit dialog for lead:", lead);
    
    // Create a deep clone of the lead to avoid reference issues
    const preparedLead: Lead = {
      ...lead,
      calculator_inputs: lead.calculator_inputs ? JSON.parse(JSON.stringify(lead.calculator_inputs)) : {},
      calculator_results: lead.calculator_results ? JSON.parse(JSON.stringify(lead.calculator_results)) : {}
    };
    
    // Before setting the editing lead, ensure callVolume is properly extracted from calculator_inputs
    if (preparedLead.calculator_inputs && 
        typeof preparedLead.calculator_inputs === 'object') {
      
      // Make sure employee_count is synced with numEmployees in calculator inputs
      if (preparedLead.employee_count) {
        preparedLead.calculator_inputs.numEmployees = Number(preparedLead.employee_count);
      } else if (preparedLead.calculator_inputs.numEmployees) {
        preparedLead.employee_count = preparedLead.calculator_inputs.numEmployees;
      }
      
      // Make sure callVolume is a number for proper proposal generation
      if (typeof preparedLead.calculator_inputs.callVolume === 'string') {
        preparedLead.calculator_inputs.callVolume = parseInt(preparedLead.calculator_inputs.callVolume, 10) || 0;
      }
      
      // Make sure aiTier is valid
      if (!preparedLead.calculator_inputs.aiTier) {
        // Default to growth if missing
        preparedLead.calculator_inputs.aiTier = 'growth';
      }
      
      // Make sure aiType is consistent with aiTier
      // If on premium plan but not using premium voice features, upgrade automatically
      if (preparedLead.calculator_inputs.aiTier === 'premium') {
        if (preparedLead.calculator_inputs.aiType === 'voice') {
          preparedLead.calculator_inputs.aiType = 'conversationalVoice';
        } else if (preparedLead.calculator_inputs.aiType === 'both') {
          preparedLead.calculator_inputs.aiType = 'both-premium';
        } else if (!preparedLead.calculator_inputs.aiType || preparedLead.calculator_inputs.aiType === 'chatbot') {
          preparedLead.calculator_inputs.aiType = 'both-premium';
        }
      }
      
      // If on starter plan but not using text only, fix it
      if (preparedLead.calculator_inputs.aiTier === 'starter' && 
          preparedLead.calculator_inputs.aiType !== 'chatbot') {
        preparedLead.calculator_inputs.aiType = 'chatbot';
        preparedLead.calculator_inputs.callVolume = 0;
      }
      
      // If on growth plan but using premium voice features, downgrade to appropriate type
      if (preparedLead.calculator_inputs.aiTier === 'growth') {
        if (preparedLead.calculator_inputs.aiType === 'conversationalVoice') {
          preparedLead.calculator_inputs.aiType = 'voice';
        } else if (preparedLead.calculator_inputs.aiType === 'both-premium') {
          preparedLead.calculator_inputs.aiType = 'both';
        } else if (!preparedLead.calculator_inputs.aiType) {
          preparedLead.calculator_inputs.aiType = 'both';
        }
      }
    }
    
    console.log("Opening edit dialog with prepared lead:", preparedLead);
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
      // Ensure calculator_inputs contains the updated employee count
      if (updatedLead.calculator_inputs && typeof updatedLead.calculator_inputs === 'object') {
        updatedLead.calculator_inputs.numEmployees = Number(updatedLead.employee_count) || 5;
      }
      
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
