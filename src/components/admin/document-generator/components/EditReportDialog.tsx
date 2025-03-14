
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
import { useProposalRevisions } from "../hooks/useProposalRevisions";
import { toast } from "@/components/ui/use-toast";

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
  
  // Add proposal revision hooks for version tracking
  const { saveProposalRevision, getNextVersionNumber, isLoading: isSavingProposal } = useProposalRevisions();
  
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
  
  // New handler to generate a proposal version with current settings
  const handleGenerateProposal = async () => {
    try {
      // Create a deep copy of the lead with current dialog values
      const leadWithCurrentValues = JSON.parse(JSON.stringify(editableLead));
      
      // Ensure calculator results reflect current dialog settings
      if (!leadWithCurrentValues.calculator_results) {
        leadWithCurrentValues.calculator_results = {};
      }
      
      // Use the same calculation logic as in handleSave to ensure consistency
      const tier = aiTier;
      const tierBasePrices = {
        starter: 99,
        growth: 229,
        premium: 429
      };
      const basePrice = tierBasePrices[tier as keyof typeof tierBasePrices];
      const additionalVoiceMinutes = tier !== 'starter' ? callVolume : 0;
      const additionalVoiceCost = tier !== 'starter' ? additionalVoiceMinutes * 0.12 : 0;
      const totalCost = basePrice + additionalVoiceCost;
      
      // Update calculator results with current dialog values
      leadWithCurrentValues.calculator_results.tierKey = tier;
      leadWithCurrentValues.calculator_results.aiType = aiType;
      leadWithCurrentValues.calculator_results.basePriceMonthly = basePrice;
      leadWithCurrentValues.calculator_results.aiCostMonthly = {
        ...leadWithCurrentValues.calculator_results.aiCostMonthly,
        voice: additionalVoiceCost,
        chatbot: basePrice,
        total: totalCost
      };
      
      // Add version metadata
      const nextVersionNumber = await getNextVersionNumber(lead.id);
      
      // Generate plan display names
      const planName = tier === 'starter' ? 'Starter Plan' : 
                      tier === 'growth' ? 'Growth Plan' : 'Premium Plan';
      
      const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                           aiType === 'voice' ? 'Basic Voice' : 
                           aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                           aiType === 'both' ? 'Text & Basic Voice' : 
                           aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Custom';
      
      // Save the proposal revision with version info
      await saveProposalRevision(
        lead.id,
        JSON.stringify(leadWithCurrentValues),
        `${planName} - ${aiTypeDisplay}`,
        `Version ${nextVersionNumber} created from current settings. Plan: ${planName}, Type: ${aiTypeDisplay}`
      );
      
      toast({
        title: "Success",
        description: `Proposal version ${nextVersionNumber} created successfully`,
      });
      
      // Also save the updated lead data
      onSave(leadWithCurrentValues);
      
    } catch (error) {
      console.error("Error generating proposal version:", error);
      toast({
        title: "Error",
        description: `Failed to create proposal version: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
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
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="secondary" 
            onClick={handleGenerateProposal}
            disabled={isSavingProposal}
            className="w-full sm:w-auto"
          >
            {isSavingProposal ? "Creating..." : "Generate Proposal Version"}
          </Button>
          <div className="flex justify-end space-x-2 w-full">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
