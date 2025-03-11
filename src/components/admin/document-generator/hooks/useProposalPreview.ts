
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePreviewProposal = async (lead: Lead) => {
    try {
      console.log("Previewing proposal for lead:", lead.id);
      console.log("Current lead calculator_inputs:", JSON.stringify(lead.calculator_inputs, null, 2));
      console.log("Current lead calculator_results:", JSON.stringify(lead.calculator_results, null, 2));
      setIsLoading(true);
      
      // Make sure we have valid calculator inputs to use
      if (!lead.calculator_inputs || !lead.calculator_results) {
        throw new Error("Lead is missing required calculator data");
      }
      
      // Deep clone to prevent any reference issues
      const leadToSend = JSON.parse(JSON.stringify(lead));
      
      // Ensure all key properties are correctly set
      if (typeof leadToSend.calculator_inputs.callVolume === 'string') {
        leadToSend.calculator_inputs.callVolume = parseInt(leadToSend.calculator_inputs.callVolume, 10) || 0;
        console.log("Converted callVolume from string to number:", leadToSend.calculator_inputs.callVolume);
      }
      
      // Ensure the calculator_results reflect the current calculator_inputs settings
      if (leadToSend.calculator_results) {
        // Set the correct tier in calculator_results based on inputs
        if (leadToSend.calculator_inputs.aiTier) {
          leadToSend.calculator_results.tierKey = leadToSend.calculator_inputs.aiTier;
        }
        
        // Set the correct AI type in calculator_results based on inputs
        if (leadToSend.calculator_inputs.aiType) {
          leadToSend.calculator_results.aiType = leadToSend.calculator_inputs.aiType;
        }
        
        // Ensure base price is correct according to tier
        const tierBasePrices = {
          starter: 99,
          growth: 229,
          premium: 429
        };
        
        const tier = leadToSend.calculator_inputs.aiTier;
        
        if (tier && tierBasePrices[tier]) {
          leadToSend.calculator_results.basePriceMonthly = tierBasePrices[tier];
        }
        
        // Calculate additional voice cost
        const additionalVoiceMinutes = leadToSend.calculator_inputs.callVolume || 0;
        const additionalVoiceCost = tier !== 'starter' ? additionalVoiceMinutes * 0.12 : 0;
        
        // Update voice cost in results
        if (leadToSend.calculator_results.aiCostMonthly) {
          leadToSend.calculator_results.aiCostMonthly.voice = additionalVoiceCost;
          leadToSend.calculator_results.aiCostMonthly.chatbot = leadToSend.calculator_results.basePriceMonthly;
          // Recalculate total based on base + voice
          leadToSend.calculator_results.aiCostMonthly.total = 
            leadToSend.calculator_results.basePriceMonthly + additionalVoiceCost;
        }
      }
      
      try {
        // First try with the direct function invoke approach using Supabase client
        console.log("Trying to invoke edge function via Supabase client...");
        
        const { data, error } = await supabase.functions.invoke("generate-proposal", {
          body: {
            lead: leadToSend,
            preview: true
          }
        });
        
        if (error) {
          throw new Error(`Edge function error: ${error.message}`);
        }
        
        if (data) {
          console.log("Successfully received data from edge function:", typeof data);
          
          // Handle the binary PDF data - it might be returned as base64
          let pdfBlob;
          
          if (typeof data === 'string') {
            // Handle base64 encoded PDF data
            const binaryData = atob(data);
            const bytes = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
              bytes[i] = binaryData.charCodeAt(i);
            }
            pdfBlob = new Blob([bytes], { type: 'application/pdf' });
          } else {
            // Handle other formats if needed
            console.log("Unknown data format from edge function:", data);
            throw new Error("Unexpected response format from server");
          }
          
          // Create a URL for the blob and open it
          const url = URL.createObjectURL(pdfBlob);
          window.open(url, '_blank');
          
          // Show success message
          toast({
            title: "Proposal Generated",
            description: "Your proposal has been generated successfully.",
            variant: "default",
          });
          
          setIsLoading(false);
          return;
        }
      } catch (invokeError) {
        // If the invoke method fails, log it and fall back to direct fetch
        console.warn("Failed to use supabase.functions.invoke, falling back to direct fetch:", invokeError);
      }
      
      // Fallback to direct fetch approach
      console.log("Falling back to direct fetch approach...");
      
      // Get the session token for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Authentication token is missing. Please log in again.");
      }
      
      // Build the URL to the edge function
      const SUPABASE_URL = "https://ujyhmchmjzlmsimtrtor.supabase.co";
      const apiUrl = `${SUPABASE_URL}/functions/v1/generate-proposal`;
      
      console.log("Calling edge function at:", apiUrl);
      console.log("Sending lead with calculator_inputs:", JSON.stringify(leadToSend.calculator_inputs, null, 2));
      console.log("Sending lead with calculator_results:", JSON.stringify(leadToSend.calculator_results, null, 2));
      
      // Make the request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          lead: leadToSend,
          preview: true
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response not OK:", response.status, errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || "Failed to generate proposal");
        } catch (e) {
          throw new Error(`Server error: ${response.status} - ${errorText || "Unknown error"}`);
        }
      }
      
      // Get the PDF binary data
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Open it in a new window
      window.open(url, '_blank');
      
      // Show success message
      toast({
        title: "Proposal Generated",
        description: "Your proposal has been generated successfully.",
        variant: "default",
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error previewing proposal:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: `Failed to preview proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      throw error;
    }
  };
  
  return {
    isLoading,
    handlePreviewProposal
  };
};
