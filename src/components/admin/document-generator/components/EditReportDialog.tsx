
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/leads";
import { PlanSelector } from "./edit-report/PlanSelector";
import { AITypeSelector } from "./edit-report/AITypeSelector";
import { VoiceMinutesInput } from "./edit-report/VoiceMinutesInput";
import { useEditReportState } from "../hooks/useEditReportState";
import { CalculatorInputs } from "@/hooks/calculator/types";

interface EditReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSave: (updatedLead: Lead) => void;
}

export const EditReportDialog = ({ isOpen, onClose, lead, onSave }: EditReportDialogProps) => {
  console.log("EditReportDialog rendering with lead:", lead);
  console.log("Lead callVolume:", lead.calculator_inputs?.callVolume);
  
  const {
    editableLead,
    handleCallVolumeChange,
    handleAITierChange,
    handleAITypeChange,
    handleSave
  } = useEditReportState(lead, onSave, onClose);
  
  // Current values
  const callVolume = editableLead.calculator_inputs?.callVolume || 0;
  const aiTier = editableLead.calculator_inputs?.aiTier || 'growth';
  const aiType = editableLead.calculator_inputs?.aiType || 'both';
  
  // Log current values for debugging
  useEffect(() => {
    console.log("EditReportDialog values:", {
      callVolume,
      aiTier,
      aiType
    });
  }, [callVolume, aiTier, aiType]);
  
  // Determine if we should show voice minutes input
  const showVoiceMinutes = aiTier !== 'starter' && 
    (aiType === 'voice' || aiType === 'conversationalVoice' || aiType === 'both' || aiType === 'both-premium');
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Report Settings</DialogTitle>
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
