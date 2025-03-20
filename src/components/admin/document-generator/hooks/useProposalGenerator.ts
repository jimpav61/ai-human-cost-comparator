
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useProposalGenerator() {
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [proposalPdf, setProposalPdf] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  
  const generateProposal = async (lead: Lead): Promise<string | null> => {
    setGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(false);
    setProposalPdf(null);
    
    try {
      console.log("Starting proposal generation with lead:", lead.id);
      
      if (!lead.id) {
        throw new Error("Lead ID is required");
      }
      
      if (!lead.calculator_results) {
        console.error("Missing calculator_results");
        throw new Error("This lead doesn't have calculator results. Edit the lead first to add calculator data.");
      }
      
      // For debugging, let's log the exact data we're sending to the edge function
      console.log("Sending lead data to edge function:", {
        id: lead.id,
        tier: lead.calculator_inputs?.aiTier,
        type: lead.calculator_inputs?.aiType,
        volume: lead.calculator_inputs?.callVolume
      });
      
      // Use Supabase Edge Function to generate the PDF
      const { data, error } = await supabase.functions.invoke("generate-proposal", {
        body: {
          lead: lead,
          mode: "preview",
          debug: true,
          returnContent: true
        }
      });
      
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(`Error from edge function: ${error.message}`);
      }
      
      if (!data || !data.success) {
        console.error("Edge function returned failure:", data);
        throw new Error(data?.error || "Unknown error in proposal generation");
      }
      
      // Check if we have PDF data
      if (!data.pdf) {
        console.error("No PDF data in response:", data);
        throw new Error("No PDF content returned from server");
      }
      
      console.log("Proposal generation successful, PDF data received of length:", data.pdf.length);
      
      // Store the PDF content
      setProposalPdf(data.pdf);
      setGenerationSuccess(true);
      
      return data.pdf;
    } catch (error) {
      console.error("Proposal generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setGenerationError(errorMessage);
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
