
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { getSafeFileName } from "./report-generator/saveReport";

export const useProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePreviewProposal = async (lead: Lead) => {
    try {
      setIsLoading(true);
      console.log("---------- ADMIN PROPOSAL PREVIEW ATTEMPT ----------");
      console.log("Generating proposal preview for lead ID:", lead.id);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ujyhmchmjzlmsimtrtor.supabase.co";
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const functionUrl = `${supabaseUrl}/functions/v1/generate-proposal?preview=true`;
      console.log(`Using Supabase URL for preview: ${functionUrl}`);
      
      if (lead.calculator_inputs) {
        const sanitizedLead = JSON.parse(JSON.stringify(lead));
        
        if (sanitizedLead.calculator_inputs.callVolume !== undefined) {
          if (typeof sanitizedLead.calculator_inputs.callVolume === 'string') {
            sanitizedLead.calculator_inputs.callVolume = parseInt(sanitizedLead.calculator_inputs.callVolume, 10) || 0;
          }
        }
        
        console.log("Sanitized lead for proposal preview:", JSON.stringify(sanitizedLead));
        
        const response = await fetch(
          functionUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({ lead: sanitizedLead, preview: true })
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response from edge function:", errorText);
          let errorMessage = "Failed to generate proposal preview";
          
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
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeCompanyName = getSafeFileName(lead);
        link.href = url;
        link.download = `${safeCompanyName}-ChatSites-Proposal-Preview.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Proposal Preview Downloaded",
          description: "You can now review the proposal before sending it.",
          duration: 1000,
        });
      } else {
        throw new Error("Calculator inputs not found in lead data");
      }
      
    } catch (error) {
      console.error("Error generating proposal preview:", error);
      toast({
        title: "Proposal Preview Failed",
        description: error instanceof Error 
          ? error.message 
          : "Failed to generate the proposal preview.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      console.log("---------- ADMIN PROPOSAL PREVIEW ATTEMPT ENDED ----------");
    }
  };
  
  return {
    isLoading,
    handlePreviewProposal
  };
};
