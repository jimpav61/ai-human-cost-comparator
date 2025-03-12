
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { handlePreviewRequest, handleEmailRequest } from "./handlers.ts";

console.log("Proposal generation function loaded");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("CORS preflight request received");
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log("Proposal generation request received");
    console.log("Request method:", req.method);
    console.log("Request headers:", JSON.stringify(Object.fromEntries([...req.headers]), null, 2));
    
    // Get URL parameters
    const url = new URL(req.url);
    const isPreview = url.searchParams.get('preview') === 'true';
    console.log("Is preview mode (from URL):", isPreview);
    
    // Parse the request body
    const requestData = await req.json();
    console.log("Request data keys:", Object.keys(requestData));
    
    const { lead, preview, saveRevision, returnContent } = requestData;

    // Log the exact calculator results being used
    console.log("RECEIVED CALCULATOR RESULTS:", JSON.stringify(lead.calculator_results, null, 2));
    console.log("Calculator results tier:", lead.calculator_results?.tierKey);
    console.log("Calculator results aiType:", lead.calculator_results?.aiType);
    console.log("Calculator results monthly costs:", lead.calculator_results?.aiCostMonthly);
    console.log("Calculator results savings:", {
      monthly: lead.calculator_results?.monthlySavings,
      yearly: lead.calculator_results?.yearlySavings,
      percentage: lead.calculator_results?.savingsPercentage
    });
    
    // Support preview parameter in both URL and request body
    const isPreviewMode = isPreview || preview === true;
    // Flag to determine if we should return the raw content instead of PDF
    const shouldReturnContent = returnContent === true;
    console.log("Final preview mode:", isPreviewMode);
    console.log("Return content flag:", shouldReturnContent);
    
    if (!lead) {
      console.error("Missing lead data in request");
      return new Response(
        JSON.stringify({ error: "Missing lead data" }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 400,
        }
      );
    }

    console.log("Lead ID:", lead.id);
    console.log("Lead company:", lead.company_name);
    console.log("Mode:", isPreviewMode ? "Preview (download only)" : "Send email");
    
    // Log calculator data to troubleshoot
    console.log("Lead calculator_inputs:", JSON.stringify(lead.calculator_inputs, null, 2));
    console.log("Lead calculator_results:", JSON.stringify(lead.calculator_results, null, 2));
    
    // Make sure we have calculator results
    if (!lead.calculator_results) {
      throw new Error("Lead is missing required calculator results");
    }
    
    // Route to the appropriate handler based on mode
    if (isPreviewMode) {
      return await handlePreviewRequest(lead, shouldReturnContent);
    } else {
      return handleEmailRequest(lead);
    }
  } catch (error) {
    console.error("Error in proposal generation:", error.message);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({
        error: "Failed to generate proposal: " + error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
