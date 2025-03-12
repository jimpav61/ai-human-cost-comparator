
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useProposalSend = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendProposal = async (lead: Lead) => {
    try {
      console.log("Sending proposal for lead:", lead.id);
      console.log("Using exact calculator_results:", JSON.stringify(lead.calculator_results, null, 2));
      setIsLoading(true);
      
      // Make sure we have valid calculator results to use
      if (!lead.calculator_results) {
        throw new Error("Lead is missing required calculator results");
      }
      
      // Deep clone to prevent any reference issues
      const leadToSend = JSON.parse(JSON.stringify(lead));
      
      // Build the URL to our edge function
      const SUPABASE_URL = "https://ujyhmchmjzlmsimtrtor.supabase.co";
      const apiUrl = new URL('/functions/v1/generate-proposal', SUPABASE_URL);
      
      console.log("Calling edge function at:", apiUrl.toString());
      console.log("Sending lead with calculator_results:", JSON.stringify(leadToSend.calculator_results, null, 2));
      
      // Make the request - sending the proposal via email with latest calculator data
      const response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead: leadToSend,
          preview: false
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send proposal");
      }
      
      // Update lead status to mark proposal as sent
      await supabase
        .from('leads')
        .update({ proposal_sent: true })
        .eq('id', lead.id);
      
      toast({
        title: "Success",
        description: `Proposal has been sent to ${lead.email}`,
        variant: "default",
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error sending proposal:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: `Failed to send proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  return {
    isLoading,
    handleSendProposal
  };
};
