
import { useState } from "react";
import { Lead } from "@/types/leads";

export function useProposalGenerator() {
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [proposalPdf, setProposalPdf] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  
  // Import the updated data connector
  const generateProposalFromSavedData = async (leadId: string) => {
    // Force fresh data retrieval from the database
    try {
      const module = await import('@/utils/calculatorDataConnector');
      console.log(`Generating proposal for lead ${leadId} with fresh data`);
      return module.generateProposalFromSavedData(leadId);
    } catch (error) {
      console.error("Error importing data connector:", error);
      throw error;
    }
  };

  const generateProposal = async (lead: Lead) => {
    setGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(false);
    
    try {
      console.log("Starting proposal generation with lead:", lead.id);
      console.log("Current tier:", lead.calculator_inputs?.aiTier || "unknown");
      console.log("Voice minutes:", lead.calculator_inputs?.callVolume || 0);
      
      // Use the data connector to generate the proposal
      const pdf = await generateProposalFromSavedData(lead.id);
      
      if (!pdf) {
        throw new Error("Failed to generate proposal");
      }
      
      console.log("Proposal generation successful");
      setProposalPdf(pdf);
      setGenerationSuccess(true);
      return pdf;
    } catch (error) {
      console.error("Error generating proposal:", error);
      setGenerationError(error instanceof Error ? error.message : "Unknown error");
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
