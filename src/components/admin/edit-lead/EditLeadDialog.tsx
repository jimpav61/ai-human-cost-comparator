
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditLeadTabs } from "./EditLeadTabs";
import { Lead } from "@/types/leads";
import { toast } from "@/components/ui/use-toast";
import { useLeadForm } from "./hooks/useLeadForm";
import { useLeadCalculator } from "./hooks/useLeadCalculator";
import { DialogActions } from "./components/DialogActions";

interface EditLeadDialogProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
}

export const EditLeadDialog = ({ lead, isOpen, onClose, onSave }: EditLeadDialogProps) => {
  console.log("EditLeadDialog rendering. isOpen:", isOpen, "lead:", lead);
  
  // Detailed logging of calculator data
  console.log("Initial calculator_results:", JSON.stringify(lead.calculator_results, null, 2));
  console.log("Initial calculator_inputs:", JSON.stringify(lead.calculator_inputs, null, 2));
  
  if (lead.calculator_results && lead.calculator_results.additionalVoiceMinutes) {
    console.log("Found additionalVoiceMinutes:", lead.calculator_results.additionalVoiceMinutes);
  }

  // Use custom hooks to manage state and logic
  const { formData, handleBasicInfoChange, setFormData } = useLeadForm(lead);
  const { calculatorInputs, calculationResults, handleCalculatorInputChange } = useLeadCalculator(lead);

  // Reset form when lead changes
  useEffect(() => {
    console.log("Lead changed in EditLeadDialog:", lead);
    setFormData(lead);
  }, [lead, setFormData]);
  
  // Sync employee count between basic info and calculator inputs
  useEffect(() => {
    // When employee count changes in basic info, update calculator inputs
    if (formData.employee_count !== calculatorInputs.numEmployees) {
      handleCalculatorInputChange('numEmployees', Number(formData.employee_count));
    }
  }, [formData.employee_count, calculatorInputs.numEmployees, handleCalculatorInputChange]);
  
  // And sync calculator numEmployees back to basic info employee_count
  useEffect(() => {
    if (calculatorInputs.numEmployees && Number(formData.employee_count) !== calculatorInputs.numEmployees) {
      handleBasicInfoChange('employee_count', calculatorInputs.numEmployees);
    }
  }, [calculatorInputs.numEmployees, formData.employee_count, handleBasicInfoChange]);

  // Handle save button click
  const handleSave = () => {
    try {
      console.log("Saving lead with calculator inputs:", calculatorInputs);
      console.log("Current calculation results:", calculationResults);
      
      // Ensure employee count is synced
      if (formData.employee_count !== calculatorInputs.numEmployees) {
        calculatorInputs.numEmployees = Number(formData.employee_count);
      }

      // Get the current tier and AI type
      const aiTier = calculatorInputs.aiTier || 'growth';
      let aiType = calculatorInputs.aiType || 'both';
      
      // Force consistent AI type values based on tier
      if (aiTier === 'starter' && aiType !== 'chatbot') {
        // Starter plan only supports text (chatbot)
        aiType = 'chatbot';
        calculatorInputs.aiType = 'chatbot';
        // Set call volume to 0 for starter plan since it doesn't support voice
        calculatorInputs.callVolume = 0;
        console.log("Forced aiType to chatbot and callVolume to 0 for starter plan");
      } else if (aiTier === 'premium') {
        // Premium plan uses conversationalVoice instead of voice
        if (aiType === 'voice') {
          aiType = 'conversationalVoice';
          calculatorInputs.aiType = 'conversationalVoice';
          console.log("Upgraded voice to conversationalVoice for premium plan");
        } else if (aiType === 'both') {
          // Premium plan uses both-premium instead of both
          aiType = 'both-premium';
          calculatorInputs.aiType = 'both-premium';
          console.log("Upgraded both to both-premium for premium plan");
        }
      } else if (aiTier === 'growth') {
        // Growth plan uses voice instead of conversationalVoice
        if (aiType === 'conversationalVoice') {
          aiType = 'voice';
          calculatorInputs.aiType = 'voice';
          console.log("Downgraded conversationalVoice to voice for growth plan");
        } else if (aiType === 'both-premium') {
          // Growth plan uses both instead of both-premium
          aiType = 'both';
          calculatorInputs.aiType = 'both';
          console.log("Downgraded both-premium to both for growth plan");
        }
      }

      // Make sure call volume is a number
      if (typeof calculatorInputs.callVolume === 'string') {
        calculatorInputs.callVolume = parseInt(calculatorInputs.callVolume, 10) || 0;
        console.log("Converted callVolume from string to number:", calculatorInputs.callVolume);
      } else if (typeof calculatorInputs.callVolume !== 'number') {
        calculatorInputs.callVolume = 0;
      }
      
      // Ensure starter plan has 0 call volume
      if (aiTier === 'starter' && calculatorInputs.callVolume > 0) {
        calculatorInputs.callVolume = 0;
        console.log("Reset callVolume to 0 for starter plan");
      }

      // Important: Make sure the calculationResults have the right additionalVoiceMinutes
      // This ensures the PDF generator has the correct data
      if (calculationResults) {
        calculationResults.additionalVoiceMinutes = calculatorInputs.callVolume;
        calculationResults.tierKey = aiTier;
        calculationResults.aiType = aiType;
        console.log("Updated calculationResults with current values:", {
          additionalVoiceMinutes: calculationResults.additionalVoiceMinutes,
          tierKey: calculationResults.tierKey,
          aiType: calculationResults.aiType
        });
      }

      // Extra log to verify callVolume is being saved correctly
      console.log("Final callVolume being saved:", calculatorInputs.callVolume, "of type:", typeof calculatorInputs.callVolume);

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

  // For debugging
  useEffect(() => {
    console.log("EditLeadDialog mounted/updated. isOpen:", isOpen);
    console.log("Current calculator inputs:", calculatorInputs);
    console.log("Current calculation results:", calculationResults);
    return () => console.log("EditLeadDialog unmounted");
  }, [isOpen, calculatorInputs, calculationResults]);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log("Dialog open state changing to:", open);
      if (!open) onClose();
    }}>
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
        
        <DialogActions onClose={onClose} onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
};
