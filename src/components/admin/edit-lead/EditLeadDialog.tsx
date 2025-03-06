
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditLeadTabs } from "./EditLeadTabs";
import { useCalculator, type CalculatorInputs } from "@/hooks/useCalculator";
import { Lead } from "@/types/leads";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface EditLeadDialogProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
}

export const EditLeadDialog = ({ lead, isOpen, onClose, onSave }: EditLeadDialogProps) => {
  const [formData, setFormData] = useState<Lead>(lead);
  console.log("EditLeadDialog rendering. isOpen:", isOpen, "lead:", lead);

  // Initialize calculator inputs from lead data or defaults
  const defaultCalculatorInputs: CalculatorInputs = {
    aiType: 'chatbot',
    aiTier: 'starter',
    role: 'customerService',
    numEmployees: lead.employee_count || 5,
    callVolume: 0,
    avgCallDuration: 0, // Keep for backward compatibility but no longer used
    chatVolume: 2000,
    avgChatLength: 0, // Keep for backward compatibility but no longer used
    avgChatResolutionTime: 0 // Keep for backward compatibility but no longer used
  };

  // Ensure we have valid calculator inputs by merging defaults with lead data if available
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>(() => {
    if (lead.calculator_inputs && typeof lead.calculator_inputs === 'object') {
      // Merge with defaults to ensure all properties exist
      const mergedInputs = { 
        ...defaultCalculatorInputs, 
        ...lead.calculator_inputs 
      } as CalculatorInputs;
      
      console.log("Initialized calculator inputs from lead:", mergedInputs);
      return mergedInputs;
    }
    return defaultCalculatorInputs;
  });

  // Use the calculator hook to get calculation results
  const calculationResults = useCalculator(calculatorInputs);

  // Reset form when lead changes
  useEffect(() => {
    console.log("Lead changed in EditLeadDialog:", lead);
    setFormData(lead);
    
    // Ensure we always have valid calculator inputs when lead changes
    if (lead.calculator_inputs && typeof lead.calculator_inputs === 'object') {
      const mergedInputs = { 
        ...defaultCalculatorInputs, 
        ...lead.calculator_inputs 
      } as CalculatorInputs;
      
      console.log("Updated calculator inputs from lead change:", mergedInputs);
      setCalculatorInputs(mergedInputs);
    } else {
      setCalculatorInputs(defaultCalculatorInputs);
    }
  }, [lead]);

  // Handle changes to basic lead information
  const handleBasicInfoChange = (field: keyof Lead, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle changes to calculator inputs
  const handleCalculatorInputChange = (field: string, value: any) => {
    console.log(`Changing calculator input ${field} to:`, value);
    setCalculatorInputs(prev => ({
      ...prev,
      [field]: value
    }));
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
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
