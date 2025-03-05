
import { useState, useEffect } from "react";
import { Lead } from "@/types/leads";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCalculator, type CalculatorInputs } from "@/hooks/useCalculator";
import { logLeadChanges, verifyVoiceMinuteUsage } from "@/utils/debugUtils";
import { EditLeadTabs } from "./EditLeadTabs";
import { useAITypeUpdater } from "./hooks/useAITypeUpdater";

interface EditLeadDialogProps {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}

export const EditLeadDialog = ({ lead, open, onClose }: EditLeadDialogProps) => {
  const [formData, setFormData] = useState<Lead>({...lead});
  const [isLoading, setIsLoading] = useState(false);
  
  const defaultInputs: CalculatorInputs = {
    aiType: 'chatbot',
    aiTier: 'starter',
    role: 'customerService',
    numEmployees: lead.employee_count || 5,
    callVolume: 0,
    avgCallDuration: 4.5,
    chatVolume: 5000,
    avgChatLength: 8,
    avgChatResolutionTime: 10,
  };
  
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>(
    lead.calculator_inputs ? 
    {
      aiType: lead.calculator_inputs.aiType || defaultInputs.aiType,
      aiTier: lead.calculator_inputs.aiTier || defaultInputs.aiTier,
      role: lead.calculator_inputs.role || defaultInputs.role,
      numEmployees: Number(lead.calculator_inputs.numEmployees) || defaultInputs.numEmployees,
      callVolume: Number(lead.calculator_inputs.callVolume) || defaultInputs.callVolume,
      avgCallDuration: Number(lead.calculator_inputs.avgCallDuration) || defaultInputs.avgCallDuration,
      chatVolume: Number(lead.calculator_inputs.chatVolume) || defaultInputs.chatVolume,
      avgChatLength: Number(lead.calculator_inputs.avgChatLength) || defaultInputs.avgChatLength,
      avgChatResolutionTime: Number(lead.calculator_inputs.avgChatResolutionTime) || defaultInputs.avgChatResolutionTime
    } : defaultInputs
  );
  
  const calculationResults = useCalculator(calculatorInputs);
  const { updateAITypeBasedOnTier } = useAITypeUpdater(calculatorInputs, setCalculatorInputs, setFormData);
  
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      calculator_results: calculationResults
    }));
  }, [calculationResults]);

  const handleBasicInfoChange = (field: keyof Lead, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCalculatorInputChange = (field: string, value: any) => {
    setCalculatorInputs(prev => {
      const updatedInputs = { ...prev, [field]: value } as CalculatorInputs;
      
      if (field === 'aiTier') {
        // Handle tier changes - will update AI type if needed
        updateAITypeBasedOnTier(value);
      } else if (field === 'aiType') {
        // Handle AI type changes - might need to update tier
        if ((value === 'voice' || value === 'both') && prev.aiTier === 'starter') {
          // Upgrade to growth for voice features
          updatedInputs.aiTier = 'growth';
          
          // Set default call volume
          const growthIncludedMinutes = AI_RATES.chatbot['growth']?.includedVoiceMinutes || 600;
          const defaultCallVolume = Math.floor(growthIncludedMinutes / prev.avgCallDuration);
          updatedInputs.callVolume = defaultCallVolume;
          
          setFormData(prevLead => ({
            ...prevLead,
            calculator_inputs: {
              ...prevLead.calculator_inputs,
              aiTier: 'growth',
              callVolume: defaultCallVolume
            }
          }));
          
          toast({
            title: "Plan Upgraded",
            description: "Voice features require at least Growth Plan. Your selection has been updated.",
          });
        } else if ((value === 'conversationalVoice' || value === 'both-premium') && prev.aiTier !== 'premium') {
          // Upgrade to premium for conversational voice
          updatedInputs.aiTier = 'premium';
          
          // Set default call volume
          const premiumIncludedMinutes = AI_RATES.chatbot['premium']?.includedVoiceMinutes || 600;
          const defaultCallVolume = Math.floor(premiumIncludedMinutes / prev.avgCallDuration);
          updatedInputs.callVolume = defaultCallVolume;
          
          setFormData(prevLead => ({
            ...prevLead,
            calculator_inputs: {
              ...prevLead.calculator_inputs,
              aiTier: 'premium',
              callVolume: defaultCallVolume
            }
          }));
          
          toast({
            title: "Plan Upgraded",
            description: "Conversational Voice requires Premium Plan. Your selection has been updated.",
          });
        }
      }
      
      return updatedInputs;
    });
    
    setFormData(prev => ({
      ...prev,
      calculator_inputs: {
        ...prev.calculator_inputs,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      const calculatorInputsForDB = { ...calculatorInputs } as Record<string, any>;
      const calculationResultsForDB = { ...calculationResults } as Record<string, any>;
      
      const originalVoiceUsage = lead.calculator_inputs ? 
        verifyVoiceMinuteUsage(
          lead.calculator_inputs.aiTier || 'starter',
          lead.calculator_inputs.callVolume || 0,
          lead.calculator_inputs.avgCallDuration || 0
        ) : null;
      
      const updatedVoiceUsage = verifyVoiceMinuteUsage(
        calculatorInputs.aiTier, 
        calculatorInputs.callVolume, 
        calculatorInputs.avgCallDuration
      );
      
      console.log('EDITING LEAD - BEFORE SAVE:', {
        originalTier: lead.calculator_inputs?.aiTier || 'starter',
        newTier: calculatorInputs.aiTier,
        originalCallVolume: lead.calculator_inputs?.callVolume || 0,
        newCallVolume: calculatorInputs.callVolume,
        originalAvgDuration: lead.calculator_inputs?.avgCallDuration || 0,
        newAvgDuration: calculatorInputs.avgCallDuration,
        originalVoiceUsage,
        updatedVoiceUsage
      });
      
      const finalLeadData = {
        ...lead,
        name: formData.name,
        company_name: formData.company_name,
        email: formData.email,
        phone_number: formData.phone_number,
        website: formData.website,
        industry: formData.industry,
        employee_count: formData.employee_count,
        calculator_inputs: calculatorInputsForDB,
        calculator_results: calculationResultsForDB,
      };
      
      logLeadChanges(lead, finalLeadData);
      
      const { error } = await supabase
        .from('leads')
        .update({
          name: formData.name,
          company_name: formData.company_name,
          email: formData.email,
          phone_number: formData.phone_number,
          website: formData.website,
          industry: formData.industry,
          employee_count: formData.employee_count,
          calculator_inputs: calculatorInputsForDB,
          calculator_results: calculationResultsForDB,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (error) {
        throw error;
      }

      console.log('LEAD SUCCESSFULLY UPDATED:', {
        leadId: lead.id,
        tierChanged: lead.calculator_inputs?.aiTier !== calculatorInputs.aiTier,
        callVolumeChanged: lead.calculator_inputs?.callVolume !== calculatorInputs.callVolume
      });

      toast({
        title: "Lead updated",
        description: "The lead has been successfully updated with recalculated values.",
      });
      
      onClose();
    } catch (error: any) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update lead. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead: {lead.company_name}</DialogTitle>
        </DialogHeader>

        <EditLeadTabs 
          formData={formData}
          calculatorInputs={calculatorInputs}
          handleBasicInfoChange={handleBasicInfoChange}
          handleCalculatorInputChange={handleCalculatorInputChange}
          calculationResults={calculationResults}
        />

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
