
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Generates a proposal PDF from a lead using the Supabase edge function
 */
export async function generateProposalFromSavedData(leadId: string) {
  try {
    console.log("Generating proposal from saved data for lead:", leadId);
    
    // Fetch the lead data from Supabase
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();
    
    if (leadError) {
      console.error("Error fetching lead:", leadError);
      throw new Error(`Failed to fetch lead data: ${leadError.message}`);
    }
    
    if (!lead) {
      console.error("Lead not found:", leadId);
      throw new Error("Lead not found");
    }
    
    // Validate calculator_results
    if (!lead.calculator_results || typeof lead.calculator_results !== 'object') {
      console.error("Missing or invalid calculator_results for lead:", leadId);
      throw new Error("Missing or invalid calculator results for this lead");
    }
    
    // Log key data for debugging
    console.log("Lead data fetched successfully:");
    console.log("- ID:", lead.id);
    console.log("- Company:", lead.company_name);
    console.log("- Calculator results available:", !!lead.calculator_results);
    
    // Call the Edge Function to generate the proposal
    const { data: proposalData, error: proposalError } = await supabase.functions.invoke(
      "generate-proposal",
      {
        body: {
          lead,
          mode: "preview",
          debug: true // Enable debug mode for verbose logging
        }
      }
    );
    
    if (proposalError) {
      console.error("Error from edge function:", proposalError);
      throw new Error(`Proposal generation failed: ${proposalError.message}`);
    }
    
    if (!proposalData) {
      console.error("No data returned from edge function");
      throw new Error("Proposal generation failed: No data returned");
    }
    
    if (!proposalData.success) {
      console.error("Edge function reported failure:", proposalData.error);
      throw new Error(`Proposal generation failed: ${proposalData.error}`);
    }
    
    // Check if we have PDF data
    if (!proposalData.pdf) {
      console.error("No PDF data in response:", proposalData);
      throw new Error("Proposal generation failed: No PDF data in response");
    }
    
    console.log("Proposal generated successfully");
    
    // Return the base64 encoded PDF
    return proposalData.pdf;
  } catch (error) {
    console.error("Error in generateProposalFromSavedData:", error);
    
    // Format the error message for better user feedback
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error generating proposal";
    
    // Show toast notification
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });
    
    // Rethrow for upstream handling
    throw error;
  }
}
