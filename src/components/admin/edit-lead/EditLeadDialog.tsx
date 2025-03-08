
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
