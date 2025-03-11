
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
  console.log("Initial aiTier:", lead.calculator_inputs?.aiTier);
  console.log("Initial aiType:", lead.calculator_inputs?.aiType);
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
    
    // Create a deep copy of the lead to avoid reference issues
    const leadToSave = JSON.parse(JSON.stringify(editableLead));
    
    // Make sure we have calculator_inputs
    if (!leadToSave.calculator_inputs) {
      leadToSave.calculator_inputs = {} as CalculatorInputs;
    }
    
    // Ensure callVolume is a number
    if (typeof leadToSave.calculator_inputs.callVolume === 'string') {
      leadToSave.calculator_inputs.callVolume = parseInt(leadToSave.calculator_inputs.callVolume, 10) || 0;
    } else if (leadToSave.calculator_inputs.callVolume === undefined || leadToSave.calculator_inputs.callVolume === null) {
      leadToSave.calculator_inputs.callVolume = 0;
    }
    
    // If aiTier is starter, force callVolume to 0
    if (leadToSave.calculator_inputs.aiTier === 'starter') {
      leadToSave.calculator_inputs.callVolume = 0;
      console.log("Reset callVolume to 0 for starter plan");
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
      
      // Make sure base price and total costs are correct
      const tierBasePrices = {
        starter: 99,
        growth: 229,
        premium: 429
      };
      
      const tier = recalcInputs.aiTier;
      updatedResults.basePriceMonthly = tierBasePrices[tier];
      
      // Calculate additional voice cost
      const additionalVoiceMinutes = recalcInputs.callVolume || 0;
      const additionalVoiceCost = tier !== 'starter' ? additionalVoiceMinutes * 0.12 : 0;
      
      // Update voice cost in results
      updatedResults.aiCostMonthly.voice = additionalVoiceCost;
      updatedResults.aiCostMonthly.chatbot = updatedResults.basePriceMonthly;
      // Recalculate total based on base + voice
      updatedResults.aiCostMonthly.total = updatedResults.basePriceMonthly + additionalVoiceCost;
      
      // Update the lead with new calculation results
      leadToSave.calculator_results = updatedResults;
      
      // Explicitly set the tierKey and aiType in the results to match inputs
      leadToSave.calculator_results.tierKey = recalcInputs.aiTier;
      leadToSave.calculator_results.aiType = recalcInputs.aiType;
    }
    
    console.log("Saving lead with updated results:", leadToSave);
    
    // Now pass the updated lead to the parent component
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
