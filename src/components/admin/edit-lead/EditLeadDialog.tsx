
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
      // Get AI type from inputs, ensure it's a valid value
      const aiTypeFromInputs = lead.calculator_inputs.aiType as string;
      const validatedAiType = validateAiType(aiTypeFromInputs);
      
      // Get tier from inputs, ensure it's a valid value
      const aiTierFromInputs = lead.calculator_inputs.aiTier as string;
      const validatedAiTier = validateAiTier(aiTierFromInputs);
      
      // Merge with defaults to ensure all properties exist
      const mergedInputs = { 
        ...defaultCalculatorInputs, 
        ...lead.calculator_inputs,
        aiType: validatedAiType,
        aiTier: validatedAiTier
      } as CalculatorInputs;
      
      console.log("Initialized calculator inputs from lead:", mergedInputs);
      return mergedInputs;
    }
    
    // Check if we can get the tier from calculator_results if calculator_inputs is empty
    if (lead.calculator_results && typeof lead.calculator_results === 'object') {
      const results = lead.calculator_results as any;
      if (results.basePriceMonthly) {
        // Determine tier from base price
        let detectedTier = 'starter' as const;
        if (results.basePriceMonthly === 229) {
          detectedTier = 'growth' as const;
        } else if (results.basePriceMonthly === 429) {
          detectedTier = 'premium' as const;
        }
        
        // Determine appropriate AI type based on tier
        let detectedAiType: 'chatbot' | 'both' | 'both-premium' = 'chatbot';
        if (detectedTier === 'growth') {
          detectedAiType = 'both';
        } else if (detectedTier === 'premium') {
          detectedAiType = 'both-premium';
        }
        
        // Update default inputs with the detected tier
        const updatedInputs: CalculatorInputs = {
          ...defaultCalculatorInputs,
          aiTier: detectedTier,
          aiType: detectedAiType
        };
        
        console.log("Detected tier from results:", detectedTier, "Updated inputs:", updatedInputs);
        return updatedInputs;
      }
    }
    
    return defaultCalculatorInputs;
  });

  // Helper function to validate aiType
  function validateAiType(aiType: string): 'chatbot' | 'voice' | 'both' | 'conversationalVoice' | 'both-premium' {
    const validTypes = ['chatbot', 'voice', 'both', 'conversationalVoice', 'both-premium'];
    return validTypes.includes(aiType) 
      ? aiType as 'chatbot' | 'voice' | 'both' | 'conversationalVoice' | 'both-premium'
      : 'chatbot';
  }
  
  // Helper function to validate aiTier
  function validateAiTier(aiTier: string): 'starter' | 'growth' | 'premium' {
    const validTiers = ['starter', 'growth', 'premium'];
    return validTiers.includes(aiTier)
      ? aiTier as 'starter' | 'growth' | 'premium' 
      : 'starter';
  }

  // Use the calculator hook to get calculation results
  const calculationResults = useCalculator(calculatorInputs);

  // Reset form when lead changes
  useEffect(() => {
    console.log("Lead changed in EditLeadDialog:", lead);
    setFormData(lead);
    
    // Ensure we always have valid calculator inputs when lead changes
    if (lead.calculator_inputs && typeof lead.calculator_inputs === 'object') {
      const aiTypeFromInputs = lead.calculator_inputs.aiType as string;
      const validatedAiType = validateAiType(aiTypeFromInputs);
      
      const aiTierFromInputs = lead.calculator_inputs.aiTier as string;
      const validatedAiTier = validateAiTier(aiTierFromInputs);
      
      const mergedInputs: CalculatorInputs = { 
        ...defaultCalculatorInputs, 
        ...lead.calculator_inputs,
        aiType: validatedAiType,
        aiTier: validatedAiTier
      };
      
      console.log("Updated calculator inputs from lead change:", mergedInputs);
      setCalculatorInputs(mergedInputs);
    } else if (lead.calculator_results && typeof lead.calculator_results === 'object') {
      // If no calculator_inputs but we have results, try to determine tier from base price
      const results = lead.calculator_results as any;
      if (results.basePriceMonthly) {
        // Determine tier from base price
        let detectedTier = 'starter' as const;
        if (results.basePriceMonthly === 229) {
          detectedTier = 'growth' as const;
        } else if (results.basePriceMonthly === 429) {
          detectedTier = 'premium' as const;
        }
        
        // Determine appropriate AI type based on tier
        let detectedAiType: 'chatbot' | 'both' | 'both-premium' = 'chatbot';
        if (detectedTier === 'growth') {
          detectedAiType = 'both';
        } else if (detectedTier === 'premium') {
          detectedAiType = 'both-premium';
        }
        
        // Update inputs with the detected tier
        const updatedInputs: CalculatorInputs = {
          ...defaultCalculatorInputs,
          aiTier: detectedTier,
          aiType: detectedAiType,
          numEmployees: lead.employee_count || defaultCalculatorInputs.numEmployees
        };
        
        console.log("Lead change: Detected tier from results:", detectedTier, "Updated inputs:", updatedInputs);
        setCalculatorInputs(updatedInputs);
      } else {
        setCalculatorInputs(defaultCalculatorInputs);
      }
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
    
    if (field === 'aiType') {
      value = validateAiType(value);
    } else if (field === 'aiTier') {
      value = validateAiTier(value);
    }
    
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
