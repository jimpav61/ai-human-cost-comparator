
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalculatorInputs, CalculationResults } from "@/hooks/calculator/types";

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
      
      // Create a deep copy of the lead to properly parse JSON strings if needed
      const processedLead = structuredClone(lead);
      
      // Ensure calculator_inputs is properly parsed and typed
      if (typeof processedLead.calculator_inputs === 'string') {
        try {
          processedLead.calculator_inputs = JSON.parse(processedLead.calculator_inputs) as CalculatorInputs;
          console.log("Parsed string calculator_inputs to object:", processedLead.calculator_inputs);
        } catch (error) {
          console.error("Failed to parse calculator_inputs string:", error);
          // If parsing fails, provide default values
          const defaultInputs: CalculatorInputs = {
            aiType: 'both',
            aiTier: 'growth',
            role: 'customerService',
            numEmployees: 1,
            hoursPerDay: 8,
            daysPerWeek: 5,
            hourlyRate: 20,
            callVolume: 0,
            chatVolume: 1000
          };
          processedLead.calculator_inputs = defaultInputs;
        }
      } else if (!processedLead.calculator_inputs || typeof processedLead.calculator_inputs !== 'object') {
        // Ensure we have valid calculator inputs
        const defaultInputs: CalculatorInputs = {
          aiType: 'both',
          aiTier: 'growth',
          role: 'customerService',
          numEmployees: 1,
          hoursPerDay: 8,
          daysPerWeek: 5,
          hourlyRate: 20,
          callVolume: 0,
          chatVolume: 1000
        };
        processedLead.calculator_inputs = defaultInputs;
      }
      
      // Ensure calculator_results is properly parsed and typed
      if (typeof processedLead.calculator_results === 'string') {
        try {
          processedLead.calculator_results = JSON.parse(processedLead.calculator_results) as CalculationResults;
          console.log("Parsed string calculator_results to object:", processedLead.calculator_results);
        } catch (error) {
          console.error("Failed to parse calculator_results string:", error);
        }
      }
      
      // For debugging, let's log the exact data we're sending to the edge function
      console.log("Sending lead data to edge function:", {
        id: processedLead.id,
        company: processedLead.company_name,
        tier: processedLead.calculator_inputs?.aiTier,
        type: processedLead.calculator_inputs?.aiType,
        volume: processedLead.calculator_inputs?.callVolume,
        fullInputs: processedLead.calculator_inputs,
        fullResults: processedLead.calculator_results
      });
      
      // Use Supabase Edge Function to generate the PDF
      const { data, error } = await supabase.functions.invoke("generate-proposal", {
        body: {
          lead: processedLead,
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
