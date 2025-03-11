
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";

export const useProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePreviewProposal = async (lead: Lead) => {
    try {
      console.log("Previewing proposal for lead:", lead.id);
      console.log("Current lead calculator_inputs:", lead.calculator_inputs);
      console.log("Current lead calculator_results:", lead.calculator_results);
      setIsLoading(true);
      
      // Make sure we have valid calculator inputs to use
      if (!lead.calculator_inputs || !lead.calculator_results) {
        throw new Error("Lead is missing required calculator data");
      }
      
      // Ensure callVolume is a number - critical for correct pricing
      if (typeof lead.calculator_inputs.callVolume === 'string') {
        lead.calculator_inputs.callVolume = parseInt(lead.calculator_inputs.callVolume, 10) || 0;
        console.log("Converted callVolume from string to number:", lead.calculator_inputs.callVolume);
      }
      
      // Build the URL to our edge function
      const SUPABASE_URL = "https://ujyhmchmjzlmsimtrtor.supabase.co";
      const apiUrl = new URL('/functions/v1/generate-proposal', SUPABASE_URL);
      apiUrl.searchParams.append('preview', 'true');
      
      console.log("Calling edge function at:", apiUrl.toString());
      console.log("Sending lead with calculator_inputs:", JSON.stringify(lead.calculator_inputs));
      
      // Make the request - ensure we're passing the complete lead object with latest calculator data
      const response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead: JSON.parse(JSON.stringify(lead)), // Deep clone to avoid reference issues
          preview: true
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate proposal");
      }
      
      // Get the PDF binary data
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Open it in a new window
      window.open(url, '_blank');
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error previewing proposal:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: `Failed to preview proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  return {
    isLoading,
    handlePreviewProposal
  };
};
