
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/leads";
import { PlanSelector } from "../edit-report/PlanSelector";
import { VoiceMinutesSelector } from "./VoiceMinutesSelector";
import { AITypeSelector } from "./AITypeSelector";
import { initializeLeadData } from "../../utils/leadDataInitializer";
import { formatCurrency } from "@/utils/formatters";
import { calculatePlanPrice } from "./calculatePlanPrice";
import { toast } from "@/hooks/use-toast";

interface ProposalEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSave: (updatedLead: Lead) => void;
}

export const ProposalEditDialog = ({ isOpen, onClose, lead, onSave }: ProposalEditDialogProps) => {
  // Initialize with lead data or defaults
  const initializedLead = initializeLeadData(lead);
  
  // Use proper type for aiTier to avoid the type error
  const [aiTier, setAiTier] = useState<"starter" | "growth" | "premium">(
    (initializedLead.calculator_inputs?.aiTier as "starter" | "growth" | "premium") || 'starter'
  );
  const [aiType, setAiType] = useState<string>(initializedLead.calculator_inputs?.aiType || 'chatbot');
  const [callVolume, setCallVolume] = useState<number>(
    typeof initializedLead.calculator_inputs?.callVolume === 'number'
      ? initializedLead.calculator_inputs.callVolume
      : 0
  );
  
  // Calculate pricing based on selected options
  const { basePrice, voiceCost, totalPrice, setupFee } = calculatePlanPrice(aiTier, callVolume);
  
  // Handle tier change with appropriate AI type adjustments
  const handleTierChange = (newTier: "starter" | "growth" | "premium") => {
    setAiTier(newTier);
    
    // Update AI type based on tier
    if (newTier === 'starter') {
      // Starter plan only supports chatbot
      setAiType('chatbot');
      setCallVolume(0);
    } else if (newTier === 'premium') {
      // Upgrade to conversational voice if applicable
      if (aiType === 'voice') {
        setAiType('conversationalVoice');
      } else if (aiType === 'both') {
        setAiType('both-premium');
      }
    } else if (newTier === 'growth') {
      // Downgrade from premium voice features if applicable
      if (aiType === 'conversationalVoice') {
        setAiType('voice');
      } else if (aiType === 'both-premium') {
        setAiType('both');
      }
    }
  };
  
  // Handle AI type change with appropriate tier adjustments
  const handleAiTypeChange = (newType: string) => {
    setAiType(newType);
    
    // Update tier based on AI type
    if ((newType === 'conversationalVoice' || newType === 'both-premium') && aiTier !== 'premium') {
      setAiTier('premium');
    } else if ((newType === 'voice' || newType === 'both') && aiTier === 'starter') {
      setAiTier('growth');
    }
  };
  
  // Handle call volume change
  const handleCallVolumeChange = (newVolume: number) => {
    setCallVolume(newVolume);
    
    // If adding voice minutes to starter plan, upgrade to growth
    if (newVolume > 0 && aiTier === 'starter') {
      setAiTier('growth');
      setAiType('both');
    }
  };
  
  // Handle save and close
  const handleSave = () => {
    // Create a deep copy of the lead to avoid reference issues
    const updatedLead = JSON.parse(JSON.stringify(lead));
    
    // Ensure calculator_inputs and calculator_results exist
    if (!updatedLead.calculator_inputs) {
      updatedLead.calculator_inputs = {};
    }
    
    if (!updatedLead.calculator_results) {
      updatedLead.calculator_results = {};
    }
    
    // Update calculator inputs with the edited values
    updatedLead.calculator_inputs.aiTier = aiTier;
    updatedLead.calculator_inputs.aiType = aiType;
    updatedLead.calculator_inputs.callVolume = callVolume;
    
    // Update calculator results to stay consistent with inputs
    updatedLead.calculator_results.tierKey = aiTier;
    updatedLead.calculator_results.aiType = aiType;
    updatedLead.calculator_results.additionalVoiceMinutes = callVolume;
    updatedLead.calculator_results.includedVoiceMinutes = aiTier === 'starter' ? 0 : 600;
    
    // Update costs in calculator results
    if (!updatedLead.calculator_results.aiCostMonthly) {
      updatedLead.calculator_results.aiCostMonthly = {};
    }
    
    updatedLead.calculator_results.aiCostMonthly.chatbot = basePrice;
    updatedLead.calculator_results.aiCostMonthly.voice = voiceCost;
    updatedLead.calculator_results.aiCostMonthly.total = totalPrice;
    updatedLead.calculator_results.aiCostMonthly.setupFee = setupFee;
    updatedLead.calculator_results.basePriceMonthly = basePrice;
    
    // Update other relevant fields in calculator_results
    const currentHumanCost = updatedLead.calculator_results.humanCostMonthly || 3800;
    updatedLead.calculator_results.monthlySavings = currentHumanCost - totalPrice;
    updatedLead.calculator_results.yearlySavings = (currentHumanCost - totalPrice) * 12;
    updatedLead.calculator_results.savingsPercentage = 
      Math.round((currentHumanCost - totalPrice) / currentHumanCost * 100);
    
    console.log("Saving proposal with updated values:", {
      aiTier,
      aiType,
      callVolume,
      basePrice,
      setupFee,
      totalPrice
    });
    
    // Call the save handler with the updated lead
    onSave(updatedLead);
    
    // Show success toast with 1 second duration
    toast({
      title: "Proposal settings updated",
      description: `Plan set to ${aiTier === 'starter' ? 'Starter' : aiTier === 'growth' ? 'Growth' : 'Premium'} with ${callVolume} additional voice minutes.`,
      duration: 1000, // Set duration to 1000ms (1 second)
    });
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Proposal Settings</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div className="grid gap-6">
            <PlanSelector value={aiTier} onChange={handleTierChange} />
            
            <AITypeSelector 
              value={aiType} 
              onChange={handleAiTypeChange} 
              currentTier={aiTier}
            />
            
            <VoiceMinutesSelector 
              value={callVolume} 
              onChange={handleCallVolumeChange} 
              currentTier={aiTier} 
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">Price Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Monthly Base Price:</div>
              <div>{formatCurrency(basePrice)}/month</div>
              
              {aiTier !== 'starter' && (
                <>
                  <div>Included Voice Minutes:</div>
                  <div>600 minutes</div>
                  
                  {callVolume > 0 && (
                    <>
                      <div>Additional Voice Minutes:</div>
                      <div>{callVolume} minutes</div>
                      
                      <div>Additional Voice Cost:</div>
                      <div>{formatCurrency(voiceCost)}/month</div>
                    </>
                  )}
                </>
              )}
              
              <div className="font-semibold">Total Monthly Cost:</div>
              <div className="font-semibold">{formatCurrency(totalPrice)}/month</div>
              
              <div>Setup Fee:</div>
              <div>{formatCurrency(setupFee)}</div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
