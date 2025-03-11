
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePreviewProposal = async (lead: Lead) => {
    try {
      console.log("Previewing proposal for lead:", lead.id);
      setIsLoading(true);
      
      // Make sure we have valid calculator inputs to use
      if (!lead.calculator_inputs || !lead.calculator_results) {
        throw new Error("Lead is missing required calculator data");
      }
      
      // Build the URL to our edge function
      const supabaseUrl = new URL(supabase.supabaseUrl);
      const apiUrl = new URL('/functions/v1/generate-proposal', supabaseUrl.origin);
      apiUrl.searchParams.append('preview', 'true');
      
      console.log("Calling edge function at:", apiUrl.toString());
      
      // Make the request
      const response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead,
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
