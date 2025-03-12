
import { useEffect, useState } from 'react';
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
  // Track if this is the initial render to avoid unnecessary state updates
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  // Use custom hooks to manage state and logic
  const { formData, handleBasicInfoChange, setFormData } = useLeadForm(lead);
  const { calculatorInputs, calculationResults, handleCalculatorInputChange } = useLeadCalculator(lead);

  // Reset form when lead changes (only on initial render)
  useEffect(() => {
    if (isOpen && isInitialRender) {
      setFormData(lead);
      setIsInitialRender(false);
    }
  }, [lead, isOpen, setFormData, isInitialRender]);
  
  // When dialog closes, reset initial render flag
  useEffect(() => {
    if (!isOpen) {
      setIsInitialRender(true);
    }
  }, [isOpen]);
  
  // Sync employee count between basic info and calculator inputs
  useEffect(() => {
    // Only update calculator when employee count changes in form data
    const formEmployeeCount = Number(formData.employee_count);
    const calculatorEmployeeCount = calculatorInputs.numEmployees;
    
    if (formEmployeeCount !== calculatorEmployeeCount) {
      handleCalculatorInputChange('numEmployees', formEmployeeCount);
    }
  }, [formData.employee_count, calculatorInputs.numEmployees, handleCalculatorInputChange]);

  // Handle save button click
  const handleSave = () => {
    try {
      // Create a copy of the form data to avoid reference issues
      const updatedLead: Lead = {
        ...formData,
        employee_count: Number(formData.employee_count),
        calculator_inputs: {
          ...calculatorInputs,
          numEmployees: Number(formData.employee_count)
        },
        calculator_results: {
          ...calculationResults,
          additionalVoiceMinutes: calculatorInputs.callVolume,
          tierKey: calculatorInputs.aiTier,
          aiType: calculatorInputs.aiType
        }
      };
      
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

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
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
