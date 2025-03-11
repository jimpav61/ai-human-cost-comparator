
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";

export const useProposalSend = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendProposal = async (lead: Lead) => {
    try {
      setIsLoading(true);
      console.log("---------- ADMIN PROPOSAL DOWNLOAD ATTEMPT ----------");
      console.log("Generating proposal for lead ID:", lead.id);
      console.log("Complete lead object:", JSON.stringify(lead));
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ujyhmchmjzlmsimtrtor.supabase.co";
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const functionUrl = `${supabaseUrl}/functions/v1/generate-proposal`;
      console.log(`Using Supabase URL: ${functionUrl}`);
      
      if (lead.calculator_inputs) {
        const sanitizedLead = JSON.parse(JSON.stringify(lead));
        
        if (sanitizedLead.calculator_inputs.callVolume !== undefined) {
          if (typeof sanitizedLead.calculator_inputs.callVolume === 'string') {
            sanitizedLead.calculator_inputs.callVolume = parseInt(sanitizedLead.calculator_inputs.callVolume, 10) || 0;
          }
        }
        
        console.log("Sanitized lead for proposal generation:", JSON.stringify(sanitizedLead));
        
        const response = await fetch(
          functionUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({ lead: sanitizedLead })
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response from edge function:", errorText);
          let errorMessage = "Failed to generate proposal";
          
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
              errorMessage = errorJson.error;
            }
          } catch (parseError) {
            errorMessage = errorText.substring(0, 100);
          }
          
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log("Proposal generated successfully:", result.message);
        
        toast({
          title: "Proposal Sent",
          description: "The proposal has been sent to the client's email.",
          duration: 1000,
        });
      } else {
        throw new Error("Calculator inputs not found in lead data");
      }
      
    } catch (error) {
      console.error("Error generating proposal:", error);
      toast({
        title: "Proposal Generation Failed",
        description: error instanceof Error 
          ? error.message 
          : "Failed to generate the proposal.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      console.log("---------- ADMIN PROPOSAL DOWNLOAD ATTEMPT ENDED ----------");
    }
  };
  
  return {
    isLoading,
    handleSendProposal
  };
};
