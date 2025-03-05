
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { useDownloadState } from "./useDownloadState";
import { generateFromExistingResults } from "./proposal-generator/generateFromExistingResults";
import { generateFromInputs } from "./proposal-generator/generateFromInputs";
import { logProposalGeneration } from "./proposal-generator/logUtils";

interface UseProposalGeneratorProps {
  lead: Lead;
}

export const useProposalGenerator = ({ lead }: UseProposalGeneratorProps) => {
  const { hasDownloaded, markAsDownloaded } = useDownloadState({
    storageKey: 'downloadedProposals',
    leadId: lead.id
  });

  const generateProposalDocument = async () => {
    try {
      // Log basic lead information and details
      logProposalGeneration(lead);
      
      // If we have calculator_results directly from the lead, use those
      if (lead.calculator_results && typeof lead.calculator_results === 'object') {
        await generateFromExistingResults(lead);
      } else {
        // Fallback logic if we don't have calculator_results
        await generateFromInputs(lead);
      }
      
      // Mark as downloaded after successful generation
      markAsDownloaded();
      
    } catch (error) {
      console.error('Proposal generation error:', error);
      toast({
        title: "Error",
        description: `Failed to generate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return {
    generateProposalDocument,
    hasDownloaded
  };
};
