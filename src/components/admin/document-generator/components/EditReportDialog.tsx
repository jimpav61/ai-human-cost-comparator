
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";

interface EditReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSave: (updatedLead: Lead) => void;
}

export const EditReportDialog = ({ isOpen, onClose, lead, onSave }: EditReportDialogProps) => {
  // Create a deep copy of the lead to avoid reference issues
  const [editableLead, setEditableLead] = useState<Lead>(() => {
    const leadCopy = JSON.parse(JSON.stringify(lead));
    
    if (!leadCopy.calculator_inputs) {
      leadCopy.calculator_inputs = {};
    }
    
    // Keep existing values or set defaults
    leadCopy.calculator_inputs.aiTier = leadCopy.calculator_inputs.aiTier || 'growth';
    leadCopy.calculator_inputs.aiType = leadCopy.calculator_inputs.aiType || 'both';
    
    // Calculate callVolume from either existing calculator_inputs or from calculator_results
    if (typeof leadCopy.calculator_inputs.callVolume === 'number') {
      console.log("Using existing callVolume from inputs:", leadCopy.calculator_inputs.callVolume);
    } 
    else if (leadCopy.calculator_results?.aiCostMonthly?.voice > 0) {
      // Calculate voice minutes from the voice cost (cost is $0.12 per minute)
      const voiceCost = leadCopy.calculator_results.aiCostMonthly.voice;
      const existingCallVolume = Math.round(voiceCost / 0.12);
      
      // Round to nearest 100
      leadCopy.calculator_inputs.callVolume = Math.round(existingCallVolume / 100) * 100;
      console.log("Calculated callVolume from voice cost:", voiceCost, "->", leadCopy.calculator_inputs.callVolume);
    } 
    else {
      leadCopy.calculator_inputs.callVolume = 0;
      console.log("No existing callVolume, defaulting to 0");
    }
    
    return leadCopy;
  });

  // Ensure dialog always shows the latest lead data when opened
  useEffect(() => {
    if (isOpen) {
      const leadCopy = JSON.parse(JSON.stringify(lead));
      
      if (!leadCopy.calculator_inputs) {
        leadCopy.calculator_inputs = {};
      }
      
      // Keep existing values or set defaults
      leadCopy.calculator_inputs.aiTier = leadCopy.calculator_inputs.aiTier || 'growth';
      leadCopy.calculator_inputs.aiType = leadCopy.calculator_inputs.aiType || 'both';
      
      // Calculate callVolume from either existing calculator_inputs or from calculator_results
      if (typeof leadCopy.calculator_inputs.callVolume === 'number') {
        console.log("useEffect: Using existing callVolume from inputs:", leadCopy.calculator_inputs.callVolume);
      } 
      else if (leadCopy.calculator_results?.aiCostMonthly?.voice > 0) {
        // Calculate voice minutes from the voice cost (cost is $0.12 per minute)
        const voiceCost = leadCopy.calculator_results.aiCostMonthly.voice;
        const existingCallVolume = Math.round(voiceCost / 0.12);
        
        // Round to nearest 100
        leadCopy.calculator_inputs.callVolume = Math.round(existingCallVolume / 100) * 100;
        console.log("useEffect: Calculated callVolume from voice cost:", voiceCost, "->", leadCopy.calculator_inputs.callVolume);
      } 
      else {
        leadCopy.calculator_inputs.callVolume = 0;
        console.log("useEffect: No existing callVolume, defaulting to 0");
      }
      
      console.log("Setting editable lead with callVolume:", leadCopy.calculator_inputs.callVolume);
      setEditableLead(leadCopy);
    }
  }, [isOpen, lead]);
  
  // Handle changes to the voice minutes input
  const handleCallVolumeChange = (value: string) => {
    // Parse as number and ensure it's a multiple of 100
    let numValue = parseInt(value, 10) || 0;
    numValue = Math.round(numValue / 100) * 100;
    
    setEditableLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...(prev.calculator_inputs || {}),
        callVolume: numValue
      }
    }));
  };
  
  // Handle changes to the AI tier
  const handleAITierChange = (value: string) => {
    setEditableLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...(prev.calculator_inputs || {}),
        aiTier: value
      }
    }));
  };
  
  // Handle changes to the AI type
  const handleAITypeChange = (value: string) => {
    setEditableLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...(prev.calculator_inputs || {}),
        aiType: value
      }
    }));
  };
  
  // Save changes
  const handleSave = () => {
    try {
      // Validate that AI type is compatible with AI tier
      const aiTier = editableLead.calculator_inputs?.aiTier || 'growth';
      let aiType = editableLead.calculator_inputs?.aiType || 'both';
      
      if (aiTier === 'starter' && aiType !== 'chatbot') {
        // Force chatbot for starter tier
        editableLead.calculator_inputs = {
          ...editableLead.calculator_inputs,
          aiType: 'chatbot',
          callVolume: 0
        };
        toast({
          title: "AI Type Adjusted",
          description: "Starter plan only supports text capabilities. Voice features have been disabled.",
        });
      } else if (aiTier === 'premium') {
        // Ensure premium voice features for premium tier
        if (aiType === 'voice') {
          editableLead.calculator_inputs = {
            ...editableLead.calculator_inputs,
            aiType: 'conversationalVoice'
          };
        } else if (aiType === 'both') {
          editableLead.calculator_inputs = {
            ...editableLead.calculator_inputs,
            aiType: 'both-premium'
          };
        }
      } else if (aiTier === 'growth') {
        // Ensure basic voice features for growth tier
        if (aiType === 'conversationalVoice') {
          editableLead.calculator_inputs = {
            ...editableLead.calculator_inputs,
            aiType: 'voice'
          };
        } else if (aiType === 'both-premium') {
          editableLead.calculator_inputs = {
            ...editableLead.calculator_inputs,
            aiType: 'both'
          };
        }
      }
      
      onSave(editableLead);
      onClose();
      
      toast({
        title: "Report Settings Updated",
        description: "The report settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving report settings:", error);
      toast({
        title: "Error",
        description: "Failed to update report settings. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Current values
  const callVolume = editableLead.calculator_inputs?.callVolume || 0;
  const aiTier = editableLead.calculator_inputs?.aiTier || 'growth';
  const aiType = editableLead.calculator_inputs?.aiType || 'both';
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Report Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="aiTier" className="col-span-1">Plan</Label>
            <Select 
              value={aiTier} 
              onValueChange={handleAITierChange}
            >
              <SelectTrigger id="aiTier" className="col-span-3">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter Plan</SelectItem>
                <SelectItem value="growth">Growth Plan</SelectItem>
                <SelectItem value="premium">Premium Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="aiType" className="col-span-1">AI Type</Label>
            <Select 
              value={aiType} 
              onValueChange={handleAITypeChange}
            >
              <SelectTrigger id="aiType" className="col-span-3">
                <SelectValue placeholder="Select AI type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatbot">Text Only</SelectItem>
                {aiTier !== 'starter' && (
                  <>
                    <SelectItem value="voice">Basic Voice</SelectItem>
                    <SelectItem value="both">Text & Basic Voice</SelectItem>
                    {aiTier === 'premium' && (
                      <>
                        <SelectItem value="conversationalVoice">Conversational Voice</SelectItem>
                        <SelectItem value="both-premium">Text & Conversational Voice</SelectItem>
                      </>
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {aiTier !== 'starter' && (aiType === 'voice' || aiType === 'conversationalVoice' || aiType === 'both' || aiType === 'both-premium') && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="callVolume" className="col-span-1">
                Additional Voice Minutes
              </Label>
              <div className="col-span-3">
                <Input
                  id="callVolume"
                  type="number"
                  value={callVolume}
                  onChange={(e) => handleCallVolumeChange(e.target.value)}
                  min={0}
                  step={100}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter additional minutes beyond the 600 included with your plan
                </p>
              </div>
            </div>
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
