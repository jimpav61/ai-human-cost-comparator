
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
  
  // Detailed debugging of calculator data
  console.log("Initial calculator_results:", JSON.stringify(lead.calculator_results, null, 2));
  console.log("Initial calculator_inputs:", JSON.stringify(lead.calculator_inputs, null, 2));
  
  // Explicitly extract critical values from calculator_results first (preferred source)
  let tierFromResults = lead.calculator_results?.tierKey || null;
  let aiTypeFromResults = lead.calculator_results?.aiType || null;
  let additionalVoiceMinutes = lead.calculator_results?.additionalVoiceMinutes || 0;
  
  console.log("Extracted from results - tier:", tierFromResults, "aiType:", aiTypeFromResults, "additionalVoiceMinutes:", additionalVoiceMinutes);

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

  // CRITICAL: Ensure calculator data is properly synchronized after initialization
  useEffect(() => {
    // This is needed to ensure the calculator data properly reflects the stored results
    if (tierFromResults && tierFromResults !== calculatorInputs.aiTier) {
      console.log(`Forcing aiTier to match results: ${tierFromResults}`);
      handleCalculatorInputChange('aiTier', tierFromResults);
    }
    
    if (aiTypeFromResults && aiTypeFromResults !== calculatorInputs.aiType) {
      console.log(`Forcing aiType to match results: ${aiTypeFromResults}`);
      handleCalculatorInputChange('aiType', aiTypeFromResults);
    }
    
    if (additionalVoiceMinutes > 0 && additionalVoiceMinutes !== calculatorInputs.callVolume) {
      console.log(`Forcing callVolume to match additionalVoiceMinutes: ${additionalVoiceMinutes}`);
      handleCalculatorInputChange('callVolume', additionalVoiceMinutes);
    }
  }, [tierFromResults, aiTypeFromResults, additionalVoiceMinutes, calculatorInputs, handleCalculatorInputChange]);

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

      // CRITICAL: Make sure the results have the correct additionalVoiceMinutes
      // This ensures the PDF generator has the correct data
      if (calculationResults) {
        // Explicitly set values from inputs to results to ensure sync
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

      console.log("Saving updated lead with calculationResults:", updatedLead.calculator_results);
      console.log("Saving updated lead with callVolume/additionalVoiceMinutes:", 
        updatedLead.calculator_inputs.callVolume,
        updatedLead.calculator_results?.additionalVoiceMinutes);
      
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
    
    // Specifically check callVolume and additionalVoiceMinutes
    console.log("Current callVolume:", calculatorInputs.callVolume);
    console.log("Current additionalVoiceMinutes:", calculationResults?.additionalVoiceMinutes);
    
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
