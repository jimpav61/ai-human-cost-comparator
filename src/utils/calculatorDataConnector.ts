
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
    
    // Ensure we have required fields in calculator_results even if they're missing
    const enhancedLead = {
      ...lead,
      calculator_results: {
        humanCostMonthly: 3800,
        aiCostMonthly: { total: 299, setupFee: 500, voice: 0, chatbot: 299 },
        monthlySavings: 3501,
        yearlySavings: 42012,
        savingsPercentage: 92,
        tierKey: 'growth',
        aiType: 'both',
        ...lead.calculator_results, // Overwrite defaults with actual data if it exists
      }
    };
    
    // Log key data for debugging
    console.log("Lead data fetched and enhanced successfully:");
    console.log("- ID:", enhancedLead.id);
    console.log("- Company:", enhancedLead.company_name);
    
    // Use a timeout to ensure we don't hang forever
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Proposal generation timed out")), 30000);
    });
    
    // Create the function invocation promise
    const functionPromise = supabase.functions.invoke(
      "generate-proposal",
      {
        body: {
          lead: enhancedLead,
          mode: "preview",
          debug: true, // Enable debug mode for verbose logging
          returnContent: true // Ensure we get the content back
        }
      }
    );
    
    // Race the function call against the timeout
    const { data: proposalData, error: proposalError } = await Promise.race([
      functionPromise,
      timeoutPromise
    ]) as any;
    
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
    
    console.log("Proposal generated successfully with PDF data length:", proposalData.pdf.length);
    
    // Return the base64 encoded PDF
    return proposalData.pdf;
  } catch (error) {
    console.error("Error in generateProposalFromSavedData:", error);
    
    // Format the error message for better user feedback
    let errorMessage = "Unknown error generating proposal";
    
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch") || 
          error.message.includes("NetworkError") || 
          error.message.includes("timed out")) {
        errorMessage = "Failed to connect to the Edge Function. Please check your network connection and try again.";
      } else {
        errorMessage = error.message;
      }
    }
    
    // Show toast notification
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });
    
    // Rethrow for upstream handling
    throw new Error(errorMessage);
  }
}
