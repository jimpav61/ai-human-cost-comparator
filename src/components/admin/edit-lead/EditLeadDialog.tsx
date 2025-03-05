
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditLeadTabs } from "./EditLeadTabs";
import { useCalculator, type CalculatorInputs } from "@/hooks/useCalculator";
import { Lead } from "@/types/leads";
import { Button } from "@/components/ui/button";
import { useAITypeUpdater } from "./hooks/useAITypeUpdater";
import { AI_RATES } from "@/constants/pricing";
import { toast } from "@/hooks/use-toast";

interface EditLeadDialogProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
}

export const EditLeadDialog = ({ lead, isOpen, onClose, onSave }: EditLeadDialogProps) => {
  const [formData, setFormData] = useState<Lead>(lead);

  // Set default calculator inputs if none exist
  const defaultCalculatorInputs: CalculatorInputs = {
    aiType: 'chatbot',
    aiTier: 'starter',
    role: 'customerService',
    numEmployees: lead.employee_count || 5,
    callVolume: 0,
    avgCallDuration: 3,
    chatVolume: 2000,
    avgChatLength: 8,
    avgChatResolutionTime: 10
  };

  // Initialize calculator inputs from lead data or defaults
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>(
    (lead.calculator_inputs as CalculatorInputs) || defaultCalculatorInputs
  );

  // Use the calculator hook to get calculation results
  const calculationResults = useCalculator(calculatorInputs);

  // Use the AI type updater hook with the correct parameters
  const { updateAITypeBasedOnTier } = useAITypeUpdater(
    calculatorInputs,
    setCalculatorInputs,
    setFormData
  );

  // Reset form when lead changes
  useEffect(() => {
    setFormData(lead);
    setCalculatorInputs((lead.calculator_inputs as CalculatorInputs) || defaultCalculatorInputs);
  }, [lead]);

  // Handle changes to basic lead information
  const handleBasicInfoChange = (field: keyof Lead, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle changes to calculator inputs
  const handleCalculatorInputChange = (field: string, value: any) => {
    setCalculatorInputs(prev => {
      const updatedInputs = { ...prev, [field]: value };
      
      // Special handling for aiTier changes
      if (field === 'aiTier') {
        // When switching to starter, force chatbot only (no voice)
        if (value === 'starter' && prev.aiType !== 'chatbot') {
          updatedInputs.aiType = 'chatbot';
          updatedInputs.callVolume = 0;
        }
        // When upgrading to growth, update voice capabilities if needed
        else if (value === 'growth') {
          if (prev.aiType === 'conversationalVoice') {
            updatedInputs.aiType = 'voice';
          } else if (prev.aiType === 'both-premium') {
            updatedInputs.aiType = 'both';
          }
        }
        // When selecting premium, enhance voice if applicable
        else if (value === 'premium') {
          if (prev.aiType === 'voice') {
            updatedInputs.aiType = 'conversationalVoice';
          } else if (prev.aiType === 'both') {
            updatedInputs.aiType = 'both-premium';
          }
        }
      }
      
      // Special handling for aiType changes
      if (field === 'aiType') {
        const newAIType = value;
        
        // Update tier based on AI type
        if ((newAIType === 'voice' || newAIType === 'both') && prev.aiTier === 'starter') {
          updatedInputs.aiTier = 'growth';
        } 
        else if ((newAIType === 'conversationalVoice' || newAIType === 'both-premium') && 
                 prev.aiTier !== 'premium') {
          updatedInputs.aiTier = 'premium';
        }
        
        // Set voice volume to 0 if switching to chatbot only
        if (newAIType === 'chatbot') {
          updatedInputs.callVolume = 0;
        }
        
        // Set chat volume to 0 if switching to voice only
        if (newAIType === 'voice' || newAIType === 'conversationalVoice') {
          updatedInputs.chatVolume = 0;
        }
      }
      
      return updatedInputs;
    });
  };

  // Handle save button click
  const handleSave = () => {
    try {
      console.log("Saving lead with calculator inputs:", calculatorInputs);
      console.log("Current calculation results:", calculationResults);

      const updatedLead: Lead = {
        ...formData,
        calculator_inputs: calculatorInputs,
        calculator_results: calculationResults
      };

      console.log("Saving updated lead:", updatedLead);
      onSave(updatedLead);
      
      toast({
        title: "Success",
        description: "Lead information updated successfully",
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving lead:", error);
      toast({
        title: "Error",
        description: `Failed to save lead: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead: {lead.name}</DialogTitle>
          <DialogDescription>
            Update lead information and calculator settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <EditLeadTabs
            formData={formData}
            calculatorInputs={calculatorInputs}
            handleBasicInfoChange={handleBasicInfoChange}
            handleCalculatorInputChange={handleCalculatorInputChange}
            calculationResults={calculationResults}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
