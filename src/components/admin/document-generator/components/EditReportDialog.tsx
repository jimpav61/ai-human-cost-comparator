
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/leads";
import { PlanSelector } from "./edit-report/PlanSelector";
import { AITypeSelector } from "./edit-report/AITypeSelector";
import { VoiceMinutesInput } from "./edit-report/VoiceMinutesInput";
import { useEditReportState } from "../hooks/useEditReportState";
import { CalculatorInputs } from "@/hooks/calculator/types";
import { performCalculations } from "@/hooks/calculator/calculations";
import { DEFAULT_AI_RATES } from "@/constants/pricing"; 

interface EditProposalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSave: (updatedLead: Lead) => void;
}

export const EditReportDialog = ({ isOpen, onClose, lead, onSave }: EditProposalDialogProps) => {
  console.log("EditProposalDialog rendering with lead:", lead);
  console.log("Initial callVolume:", lead.calculator_inputs?.callVolume);
  
  const {
    editableLead,
    handleCallVolumeChange,
    handleAITierChange,
    handleAITypeChange,
    handleSave: originalHandleSave
  } = useEditReportState(lead, onSave, onClose);
  
  // Current values - ensure we have non-null values for all fields
  const callVolume = editableLead.calculator_inputs?.callVolume ?? 0;
  const aiTier = editableLead.calculator_inputs?.aiTier || 'growth';
  const aiType = editableLead.calculator_inputs?.aiType || 'both';
  
  // Log current values for debugging
  useEffect(() => {
    console.log("EditProposalDialog values:", {
      callVolume,
      aiTier,
      aiType
    });
  }, [callVolume, aiTier, aiType]);
  
  // Enhanced save handler that recalculates results
  const handleSave = () => {
    console.log("Saving with recalculation of results");
    
    // Create a copy of the lead to avoid reference issues
    const leadToSave = {...editableLead};
    
    // Make sure we have calculator_inputs
    if (!leadToSave.calculator_inputs) {
      leadToSave.calculator_inputs = {} as CalculatorInputs;
    }
    
    // Ensure callVolume is a number
    if (typeof leadToSave.calculator_inputs.callVolume === 'string') {
      leadToSave.calculator_inputs.callVolume = parseInt(leadToSave.calculator_inputs.callVolume, 10) || 0;
    }
    
    // If we have enough data to recalculate, do it
    if (leadToSave.calculator_inputs) {
      // Create a valid CalculatorInputs object for recalculation
      const recalcInputs: CalculatorInputs = {
        aiTier: leadToSave.calculator_inputs.aiTier || 'growth',
        aiType: leadToSave.calculator_inputs.aiType || 'both',
        role: leadToSave.calculator_inputs.role || 'customerService',
        numEmployees: leadToSave.calculator_inputs.numEmployees || Number(leadToSave.employee_count) || 5,
        callVolume: leadToSave.calculator_inputs.callVolume || 0,
        avgCallDuration: leadToSave.calculator_inputs.avgCallDuration || 0,
        chatVolume: leadToSave.calculator_inputs.chatVolume || 2000,
        avgChatLength: leadToSave.calculator_inputs.avgChatLength || 0,
        avgChatResolutionTime: leadToSave.calculator_inputs.avgChatResolutionTime || 0
      };
      
      console.log("Recalculating with inputs:", recalcInputs);
      
      // Perform calculation to get updated results
      const updatedResults = performCalculations(recalcInputs, DEFAULT_AI_RATES);
      console.log("Recalculated results:", updatedResults);
      
      // Update the lead with new calculation results
      leadToSave.calculator_results = updatedResults;
    }
    
    // Now we need to modify how we pass this to our onSave function
    // First set the current editableLead state to our updated lead
    // Then call the original handleSave which will use this updated state
    onSave(leadToSave);
    onClose();
  };
  
  // Determine if we should show voice minutes input
  const showVoiceMinutes = aiTier !== 'starter' && 
    (aiType === 'voice' || aiType === 'conversationalVoice' || aiType === 'both' || aiType === 'both-premium');
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Proposal Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <PlanSelector 
            value={aiTier} 
            onChange={handleAITierChange} 
          />
          
          <AITypeSelector 
            value={aiType} 
            onChange={handleAITypeChange}
            tier={aiTier}
          />
          
          {showVoiceMinutes && (
            <VoiceMinutesInput
              value={callVolume}
              onChange={handleCallVolumeChange}
            />
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
