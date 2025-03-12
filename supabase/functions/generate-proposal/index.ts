
// Follow Deno API reference at https://deno.land/api@v1.38.5
// Learn more about Supabase at https://supabase.com/docs/guides/functions/deno

import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { generateProfessionalProposal } from "./pdf-generator.ts";
import { handleProposalRequest } from "./handlers.ts";

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
    
    if (typeof lead.calculator_results !== 'object') {
      throw new Error(`Invalid calculator_results: ${JSON.stringify(lead.calculator_results)}`);
    }
    
    // Log the calculator results for debugging
    console.log("CALCULATOR RESULTS:", JSON.stringify(lead.calculator_results, null, 2));
    
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
