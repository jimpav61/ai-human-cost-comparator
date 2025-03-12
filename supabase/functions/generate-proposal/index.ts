
// Follow Deno API reference at https://deno.land/api@v1.38.5
// Learn more about Supabase at https://supabase.com/docs/guides/functions/deno

import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { generateProfessionalProposal } from "./pdf-generator.ts";

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
    
    // CRITICAL: Ensure calculator_inputs is an object not a string
    if (typeof lead.calculator_inputs === 'string') {
      try {
        lead.calculator_inputs = JSON.parse(lead.calculator_inputs);
        console.log("Successfully parsed calculator_inputs from string to object");
      } catch (e) {
        console.error("Error parsing calculator_inputs:", e);
        // Don't throw, just log - we might not need this for proposal generation
      }
    }
    
    // DEBUG: Log key values from calculator results we'll use in the proposal
    console.log("CALCULATOR RESULTS DEBUGGING:");
    console.log("humanCostMonthly:", lead.calculator_results.humanCostMonthly);
    console.log("aiCostMonthly.total:", lead.calculator_results.aiCostMonthly?.total);
    console.log("monthlySavings:", lead.calculator_results.monthlySavings);
    console.log("yearlySavings:", lead.calculator_results.yearlySavings);
    console.log("savingsPercentage:", lead.calculator_results.savingsPercentage);
    
    // Generate the PDF using exact values from calculator_results
    const pdfContent = generateProfessionalProposal(lead);
    
    // Return the PDF content
    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: pdfContent,
        message: "Proposal generated successfully"
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
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
