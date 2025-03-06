
import { useState } from "react";
import { Lead } from "@/types/leads";
import { supabaseClient } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useEmailProposal = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendProposalEmail = async (lead: Lead) => {
    try {
      setIsLoading(true);
      
      // Extract essential data for email
      const aiTier = lead.calculator_inputs?.aiTier || 'growth';
      
      // Get call volume (additional voice minutes) directly from calculator inputs
      const callVolume = lead.calculator_inputs?.callVolume ? 
        parseInt(String(lead.calculator_inputs.callVolume), 10) : 0;
      
      // Call the Supabase Edge Function
      const { data, error } = await supabaseClient.functions.invoke("generate-proposal", {
        body: { lead },
      });
      
      if (error) throw error;
      
      setIsLoading(false);
      toast({
        title: "Success",
        description: `Proposal email sent to ${lead.email}`,
        variant: "default",
      });
      return data;
    } catch (error) {
      console.error('Error sending proposal email:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send proposal email",
        variant: "destructive",
      });
      return null;
    }
  };

  return { sendProposalEmail, isLoading };
};
