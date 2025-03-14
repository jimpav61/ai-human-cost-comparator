
// Follow Deno API reference at https://deno.land/api@v1.38.5
// Learn more about Supabase at https://supabase.com/docs/guides/functions/deno

import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { handlePreviewRequest, handleEmailRequest } from "./handlers.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { lead } = await req.json();
    
    // Log the received data for debugging (sensitive info redacted)
    console.log("=== RECEIVED PROPOSAL GENERATION REQUEST ===");
    console.log("Lead ID:", lead.id);
    console.log("Company:", lead.company_name);
    console.log("Calculator inputs type:", typeof lead.calculator_inputs);
    console.log("Calculator results type:", typeof lead.calculator_results);
    console.log("Raw calculator results:", JSON.stringify(lead.calculator_results));
    
    // CRITICAL: Ensure calculator_results is an object not a string
    if (!lead.calculator_results || typeof lead.calculator_results !== 'object') {
      // If calculator_results is a string, try to parse it
      if (typeof lead.calculator_results === 'string') {
        try {
          lead.calculator_results = JSON.parse(lead.calculator_results);
          console.log("Successfully parsed calculator_results from string to object");
        } catch (e) {
          throw new Error(`Invalid calculator_results: Failed to parse string: ${e.message}`);
        }
      } else {
        throw new Error(`Invalid calculator_results: ${JSON.stringify(lead.calculator_results)}`);
      }
    }
    
    // NEW: Make a copy of the lead object with all data intact and ensure values are available
    console.log("Using EXACT calculator_results values without recalculation");
    
    // DEBUG: Log key values we'll use in the proposal
    console.log("CRITICAL VALUES:");
    console.log("humanCostMonthly:", lead.calculator_results.humanCostMonthly);
    console.log("aiCostMonthly.total:", lead.calculator_results.aiCostMonthly?.total);
    console.log("monthlySavings:", lead.calculator_results.monthlySavings);
    console.log("yearlySavings:", lead.calculator_results.yearlySavings);
    console.log("savingsPercentage:", lead.calculator_results.savingsPercentage);
    
    // Determine if this is a preview or email request
    const mode = lead.mode || "preview";
    const shouldReturnContent = lead.returnContent === true;
    
    if (mode === "preview") {
      return handlePreviewRequest(lead, shouldReturnContent);
    } else if (mode === "email") {
      return handleEmailRequest(lead);
    } else {
      throw new Error(`Invalid mode: ${mode}`);
    }
  } catch (error) {
    // Log the error for debugging
    console.error("Error generating proposal:", error);
    
    // Return the error
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
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
