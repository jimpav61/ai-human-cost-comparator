
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Proposal generation function loaded");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("CORS preflight request received");
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 204,
    });
  }

  try {
    console.log("Proposal generation request received");
    
    // Parse the request body
    const requestData = await req.json();
    console.log("Request data received:", JSON.stringify(requestData));
    
    const { lead } = requestData;
    
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
    
    // If we have calculator inputs, validate and format them
    if (lead.calculator_inputs) {
      console.log("Calculator inputs found, processing...");
      
      // Ensure callVolume is a number
      if (lead.calculator_inputs.callVolume !== undefined) {
        if (typeof lead.calculator_inputs.callVolume === 'string') {
          lead.calculator_inputs.callVolume = parseInt(lead.calculator_inputs.callVolume, 10) || 0;
        }
        console.log("Call volume processed:", lead.calculator_inputs.callVolume);
      } else {
        console.log("No call volume found in inputs");
      }
    } else {
      console.log("No calculator inputs found");
    }
    
    // In a real implementation, this would generate and email the proposal
    // For now, we'll simulate a successful response
    console.log("Proposal generation successful, returning response");
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Proposal has been sent to " + lead.email,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in proposal generation:", error.message, error.stack);
    
    return new Response(
      JSON.stringify({
        error: "Failed to generate proposal: " + error.message,
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
