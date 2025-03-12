
import { useState } from "react";
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalculatorInputs, CalculationResults } from "@/hooks/calculator/types";
import { toJson, fromJson, getDefaultCalculatorInputs, getDefaultCalculationResults } from "@/hooks/calculator/supabase-types";

export function useLeadEditing(onLeadUpdated?: () => void) {
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleOpenEditDialog = (lead: Lead) => {
    console.log("Opening edit dialog for lead:", lead);
    
    // Create a deep clone of the lead to avoid reference issues
    const preparedLead: Lead = JSON.parse(JSON.stringify(lead));
    
    // Default calculator_inputs and results if they don't exist
    if (!preparedLead.calculator_inputs || typeof preparedLead.calculator_inputs !== 'object') {
      preparedLead.calculator_inputs = getDefaultCalculatorInputs();
    }
    
    if (!preparedLead.calculator_results || typeof preparedLead.calculator_results !== 'object') {
      preparedLead.calculator_results = getDefaultCalculationResults();
    }
    
    // CRITICAL: Extract key data from calculator_results first (it's more authoritative)
    const resultsData = preparedLead.calculator_results;
    if (resultsData) {
      console.log("Found calculator_results with tierKey:", resultsData.tierKey);
      console.log("Found calculator_results with aiType:", resultsData.aiType);
      console.log("Found calculator_results with additionalVoiceMinutes:", resultsData.additionalVoiceMinutes);
      
      // Ensure calculator_inputs matches calculator_results values
      if (resultsData.tierKey && preparedLead.calculator_inputs) {
        preparedLead.calculator_inputs.aiTier = resultsData.tierKey;
      }
      
      if (resultsData.aiType && preparedLead.calculator_inputs) {
        preparedLead.calculator_inputs.aiType = resultsData.aiType;
      }
      
      if (typeof resultsData.additionalVoiceMinutes === 'number' && preparedLead.calculator_inputs) {
        preparedLead.calculator_inputs.callVolume = resultsData.additionalVoiceMinutes;
      }
    }
    
    // Before setting the editing lead, ensure callVolume is properly extracted from calculator_inputs
    if (preparedLead.calculator_inputs) {
      // Make sure employee_count is synced with numEmployees in calculator inputs
      if (preparedLead.employee_count) {
        preparedLead.calculator_inputs.numEmployees = Number(preparedLead.employee_count);
      } else if (preparedLead.calculator_inputs.numEmployees) {
        preparedLead.employee_count = preparedLead.calculator_inputs.numEmployees;
      }
      
      // Make sure callVolume is a number for proper proposal generation
      if (typeof preparedLead.calculator_inputs.callVolume === 'string') {
        preparedLead.calculator_inputs.callVolume = parseInt(preparedLead.calculator_inputs.callVolume, 10) || 0;
      } else if (typeof preparedLead.calculator_inputs.callVolume !== 'number') {
        preparedLead.calculator_inputs.callVolume = 0;
      }
      
      // Make sure aiTier is valid
      if (!preparedLead.calculator_inputs.aiTier) {
        // Default to growth if missing
        preparedLead.calculator_inputs.aiTier = 'growth';
      }
      
      // Make sure aiType is consistent with aiTier
      const aiTier = preparedLead.calculator_inputs.aiTier;
      let aiType = preparedLead.calculator_inputs.aiType || 'both';
      
      // If on premium plan but not using premium voice features, upgrade automatically
      if (aiTier === 'premium') {
        if (aiType === 'voice') {
          aiType = 'conversationalVoice';
          preparedLead.calculator_inputs.aiType = 'conversationalVoice';
        } else if (aiType === 'both') {
          aiType = 'both-premium';
          preparedLead.calculator_inputs.aiType = 'both-premium';
        } else if (!aiType || aiType === 'chatbot') {
          aiType = 'both-premium';
          preparedLead.calculator_inputs.aiType = 'both-premium';
        }
      }
      
      // If on starter plan but not using text only, fix it
      if (aiTier === 'starter') {
        if (aiType !== 'chatbot') {
          aiType = 'chatbot';
          preparedLead.calculator_inputs.aiType = 'chatbot';
        }
        preparedLead.calculator_inputs.callVolume = 0;
      }
      
      // If on growth plan but using premium voice features, downgrade to appropriate type
      if (aiTier === 'growth') {
        if (aiType === 'conversationalVoice') {
          aiType = 'voice';
          preparedLead.calculator_inputs.aiType = 'voice';
        } else if (aiType === 'both-premium') {
          aiType = 'both';
          preparedLead.calculator_inputs.aiType = 'both';
        } else if (!aiType) {
          aiType = 'both';
          preparedLead.calculator_inputs.aiType = 'both';
        }
      }
      
      console.log("Prepared lead calculator inputs:", preparedLead.calculator_inputs);
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
        
        // Ensure AI type is consistent with tier before saving
        const aiTier = updatedLead.calculator_inputs.aiTier || 'growth';
        let aiType = updatedLead.calculator_inputs.aiType || 'both';
        
        // Force consistent AI type values based on tier
        if (aiTier === 'starter' && aiType !== 'chatbot') {
          aiType = 'chatbot';
          updatedLead.calculator_inputs.aiType = 'chatbot';
          updatedLead.calculator_inputs.callVolume = 0;
        } else if (aiTier === 'premium') {
          if (aiType === 'voice') {
            aiType = 'conversationalVoice';
            updatedLead.calculator_inputs.aiType = 'conversationalVoice';
          } else if (aiType === 'both') {
            aiType = 'both-premium';
            updatedLead.calculator_inputs.aiType = 'both-premium';
          }
        } else if (aiTier === 'growth') {
          if (aiType === 'conversationalVoice') {
            aiType = 'voice';
            updatedLead.calculator_inputs.aiType = 'voice';
          } else if (aiType === 'both-premium') {
            aiType = 'both';
            updatedLead.calculator_inputs.aiType = 'both';
          }
        }
      }
      
      // Make sure the calculator_results data is updated with the latest calculator_inputs
      if (updatedLead.calculator_results && updatedLead.calculator_inputs) {
        // Ensure aiType and tierKey match in both objects
        updatedLead.calculator_results.aiType = updatedLead.calculator_inputs.aiType;
        updatedLead.calculator_results.tierKey = updatedLead.calculator_inputs.aiTier;
        
        // Make sure additionalVoiceMinutes matches callVolume
        updatedLead.calculator_results.additionalVoiceMinutes = updatedLead.calculator_inputs.callVolume;
      }
      
      // Update the lead in the database - use toJson to properly convert types
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
          calculator_inputs: toJson(updatedLead.calculator_inputs),
          calculator_results: toJson(updatedLead.calculator_results)
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
