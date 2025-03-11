
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { generatePDF } from "@/components/calculator/pdf";
import { getSafeFileName } from "./report-generator/saveReport";

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
      
      // Ensure all key properties are correctly set
      if (typeof leadToSend.calculator_inputs.callVolume === 'string') {
        leadToSend.calculator_inputs.callVolume = parseInt(leadToSend.calculator_inputs.callVolume, 10) || 0;
        console.log("Converted callVolume from string to number:", leadToSend.calculator_inputs.callVolume);
      } else if (leadToSend.calculator_inputs.callVolume === undefined || leadToSend.calculator_inputs.callVolume === null) {
        leadToSend.calculator_inputs.callVolume = 0;
        console.log("Set default callVolume to 0");
      }
      
      // CRITICAL FIX: Make sure the aiTier and aiType from inputs match what's in results
      // This ensures the proposal and calculator report use the same data
      if (leadToSend.calculator_results) {
        // Ensure the calculator_results reflect the current calculator_inputs settings
        
        // Set the correct tier in calculator_results based on inputs
        if (leadToSend.calculator_inputs.aiTier) {
          leadToSend.calculator_results.tierKey = leadToSend.calculator_inputs.aiTier;
          console.log("Setting tierKey in results from inputs:", leadToSend.calculator_results.tierKey);
        }
        
        // Set the correct AI type in calculator_results based on inputs
        if (leadToSend.calculator_inputs.aiType) {
          leadToSend.calculator_results.aiType = leadToSend.calculator_inputs.aiType;
          console.log("Setting aiType in results from inputs:", leadToSend.calculator_results.aiType);
        }
        
        // CRITICAL FIX: Ensure monthly total cost is calculated correctly in calculator_results
        // Make sure base price is correct according to tier
        const tierBasePrices = {
          starter: 99,
          growth: 229,
          premium: 429
        };
        
        const tier = leadToSend.calculator_inputs.aiTier;
        
        if (tier && tierBasePrices[tier]) {
          leadToSend.calculator_results.basePriceMonthly = tierBasePrices[tier];
          console.log("Updated basePriceMonthly to match tier:", leadToSend.calculator_results.basePriceMonthly);
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
          
          console.log("Updated voice cost and total cost in results:", 
            leadToSend.calculator_results.aiCostMonthly);
        }
      }
      
      // Build the URL to our edge function
      const SUPABASE_URL = "https://ujyhmchmjzlmsimtrtor.supabase.co";
      const apiUrl = new URL('/functions/v1/generate-proposal', SUPABASE_URL);
      apiUrl.searchParams.append('preview', 'true');
      
      console.log("Calling edge function at:", apiUrl.toString());
      console.log("Sending lead with calculator_inputs:", JSON.stringify(leadToSend.calculator_inputs, null, 2));
      console.log("Sending lead with calculator_results:", JSON.stringify(leadToSend.calculator_results, null, 2));
      
      try {
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
        
        // Show success message
        toast({
          title: "Proposal Generated",
          description: "Your proposal has been generated successfully.",
          variant: "default",
        });
      } catch (fetchError) {
        console.error("Error fetching from edge function:", fetchError);
        toast({
          title: "Error",
          description: "Server error generating proposal. Please try again later.",
          variant: "destructive",
        });
        throw fetchError;
      }
      
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
