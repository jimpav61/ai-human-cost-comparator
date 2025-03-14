
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
    
    // Create a deep copy to avoid reference issues
    const leadCopy = JSON.parse(JSON.stringify(lead));
    
    // Validate and provide fallback data if calculator_results is missing or invalid
    if (!leadCopy.calculator_results || typeof leadCopy.calculator_results !== 'object') {
      console.log("Missing or incomplete calculator_results, creating default values");
      
      // Get values from calculator_inputs if available
      const aiTier = leadCopy.calculator_inputs?.aiTier || 'growth';
      const aiType = leadCopy.calculator_inputs?.aiType || 'both';
      const callVolume = leadCopy.calculator_inputs?.callVolume || 0;
      
      // Create default calculator results based on tier
      const tierBasePrices = {
        starter: 99,
        growth: 229,
        premium: 429
      };
      
      const basePrice = tierBasePrices[aiTier as keyof typeof tierBasePrices] || 229;
      const setupFee = aiTier === 'starter' ? 299 : aiTier === 'growth' ? 499 : 999;
      const voiceCost = aiTier !== 'starter' ? Math.round(callVolume * 0.12) : 0;
      const totalCost = basePrice + voiceCost;
      
      // Default human cost
      const humanCostMonthly = 3800;
      
      // Calculate savings
      const monthlySavings = humanCostMonthly - totalCost;
      const yearlySavings = monthlySavings * 12;
      const savingsPercentage = Math.round((monthlySavings / humanCostMonthly) * 100);
      
      // Create complete calculator_results structure
      leadCopy.calculator_results = {
        humanCostMonthly,
        aiCostMonthly: { 
          total: totalCost, 
          setupFee, 
          voice: voiceCost, 
          chatbot: basePrice 
        },
        monthlySavings,
        yearlySavings,
        savingsPercentage,
        tierKey: aiTier,
        aiType,
        basePriceMonthly: basePrice,
        additionalVoiceMinutes: callVolume
      };
      
      console.log("Created default calculator_results:", leadCopy.calculator_results);
    } else {
      // Ensure all required fields exist in calculator_results
      leadCopy.calculator_results = {
        humanCostMonthly: 3800,
        aiCostMonthly: { 
          total: 299, 
          setupFee: 500, 
          voice: 0, 
          chatbot: 299 
        },
        monthlySavings: 3501,
        yearlySavings: 42012,
        savingsPercentage: 92,
        tierKey: 'growth',
        aiType: 'both',
        basePriceMonthly: 299,
        additionalVoiceMinutes: 0,
        ...leadCopy.calculator_results, // Overwrite defaults with actual data if it exists
      };
    }
    
    // Ensure calculator_inputs exists
    if (!leadCopy.calculator_inputs) {
      leadCopy.calculator_inputs = {
        aiTier: leadCopy.calculator_results.tierKey || 'growth',
        aiType: leadCopy.calculator_results.aiType || 'both',
        callVolume: leadCopy.calculator_results.additionalVoiceMinutes || 0,
        numEmployees: leadCopy.employee_count || 5,
        chatVolume: 2000,
        role: 'customerService',
        avgCallDuration: 4.5,
        avgChatLength: 8,
        avgChatResolutionTime: 10
      };
    }
    
    // Log key data for debugging
    console.log("Lead data prepared successfully:");
    console.log("- ID:", leadCopy.id);
    console.log("- Company:", leadCopy.company_name);
    console.log("- aiTier:", leadCopy.calculator_results.tierKey);
    console.log("- aiType:", leadCopy.calculator_results.aiType);
    console.log("- callVolume:", leadCopy.calculator_results.additionalVoiceMinutes);
    
    // Use a timeout to ensure we don't hang forever
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Proposal generation timed out")), 30000);
    });
    
    // Create the function invocation promise
    const functionPromise = supabase.functions.invoke(
      "generate-proposal",
      {
        body: {
          lead: leadCopy,
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
