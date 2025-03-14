
import { useState } from 'react';
import { Lead } from '@/types/leads';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useProposalGenerator() {
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [proposalPdf, setProposalPdf] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // Import the updated data connector
  const generateProposalFromSavedData = async (leadId: string) => {
    try {
      const module = await import('@/utils/calculatorDataConnector');
      return module.generateProposalFromSavedData(leadId);
    } catch (error) {
      console.error("Error importing calculatorDataConnector:", error);
      throw new Error("Failed to load proposal generator module");
    }
  };

  const generateProposal = async (lead: Lead) => {
    setGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(false);
    
    try {
      console.log("Starting proposal generation with lead:", lead.id);
      
      if (!lead.id) {
        throw new Error("Lead ID is required");
      }
      
      // Ensure calculator_results is present and valid
      if (!lead.calculator_results || typeof lead.calculator_results !== 'object') {
        console.error("Invalid calculator_results:", lead.calculator_results);
        throw new Error("Missing or invalid calculator results data");
      }
      
      // Use the data connector to generate the proposal
      const pdf = await generateProposalFromSavedData(lead.id);
      
      if (!pdf) {
        throw new Error("Failed to generate proposal: Empty response");
      }
      
      console.log("Proposal generation successful, PDF length:", pdf.length);
      setProposalPdf(pdf);
      setGenerationSuccess(true);
      
      // Show success toast
      toast({
        title: "Success",
        description: "Proposal generated successfully",
        variant: "default"
      });
      
      return pdf;
    } catch (error) {
      console.error("Error generating proposal:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setGenerationError(errorMsg);
      
      // Show error toast
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return {
    generating,
    generationError,
    proposalPdf,
    generationSuccess,
    generateProposal,
  };
}
