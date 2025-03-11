
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";

export const useProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePreviewProposal = async (lead: Lead) => {
    try {
      console.log("Previewing proposal for lead:", lead.id);
      console.log("Current lead calculator_inputs:", JSON.stringify(lead.calculator_inputs, null, 2));
      console.log("Current lead calculator_results:", JSON.stringify(lead.calculator_results, null, 2));
      console.log("Lead AI tier:", lead.calculator_inputs?.aiTier);
      console.log("Lead AI type:", lead.calculator_inputs?.aiType);
      console.log("Lead additional voice minutes:", lead.calculator_inputs?.callVolume);
      setIsLoading(true);
      
      // Make sure we have valid calculator inputs to use
      if (!lead.calculator_inputs || !lead.calculator_results) {
        throw new Error("Lead is missing required calculator data");
      }
      
      // Deep clone to prevent any reference issues
      const leadToSend = JSON.parse(JSON.stringify(lead));
      
      // Ensure callVolume is a number - critical for correct pricing
      if (typeof leadToSend.calculator_inputs.callVolume === 'string') {
        leadToSend.calculator_inputs.callVolume = parseInt(leadToSend.calculator_inputs.callVolume, 10) || 0;
        console.log("Converted callVolume from string to number:", leadToSend.calculator_inputs.callVolume);
      } else if (leadToSend.calculator_inputs.callVolume === undefined || leadToSend.calculator_inputs.callVolume === null) {
        leadToSend.calculator_inputs.callVolume = 0;
        console.log("Set default callVolume to 0");
      }
      
      // Double-check aiTier, aiType and callVolume are set correctly
      if (!leadToSend.calculator_inputs.aiTier) {
        leadToSend.calculator_inputs.aiTier = leadToSend.calculator_results?.tierKey || 'growth';
        console.log("Set missing aiTier from calculator_results:", leadToSend.calculator_inputs.aiTier);
      }
      
      if (!leadToSend.calculator_inputs.aiType) {
        leadToSend.calculator_inputs.aiType = leadToSend.calculator_results?.aiType || 'both';
        console.log("Set missing aiType from calculator_results:", leadToSend.calculator_inputs.aiType);
      }
      
      if (leadToSend.calculator_inputs.aiTier === 'starter') {
        // Force callVolume to 0 for starter plan
        leadToSend.calculator_inputs.callVolume = 0;
        console.log("Reset callVolume to 0 for starter plan");
      }
      
      // Build the URL to our edge function
      const SUPABASE_URL = "https://ujyhmchmjzlmsimtrtor.supabase.co";
      const apiUrl = new URL('/functions/v1/generate-proposal', SUPABASE_URL);
      apiUrl.searchParams.append('preview', 'true');
      
      console.log("Calling edge function at:", apiUrl.toString());
      console.log("Sending lead with calculator_inputs:", JSON.stringify(leadToSend.calculator_inputs, null, 2));
      
      // Make the request - ensure we're passing the complete lead object with latest calculator data
      const response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead: leadToSend,
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
