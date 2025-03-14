
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
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Invalid JSON in request body:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid JSON in request body" 
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 400,
        }
      );
    }
    
    const { 
      lead, 
      mode = "preview", 
      returnContent = false, 
      debug = true, // Enable debug by default for troubleshooting
      version = null 
    } = requestData;
    
    // Validate lead data
    if (!lead || !lead.id || !lead.company_name) {
      console.error("Missing or invalid lead data");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing or invalid lead data",
          requiredFields: "id, company_name" 
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 400,
        }
      );
    }
    
    // Log the received data for debugging (sensitive info redacted)
    console.log("=== RECEIVED ENHANCED PROPOSAL GENERATION REQUEST ===");
    console.log("Lead ID:", lead.id);
    console.log("Company:", lead.company_name);
    console.log("Debug mode:", debug);
    console.log("Mode:", mode);
    console.log("Return Content:", returnContent);
    console.log("Version:", version);
    console.log("Calculator inputs type:", typeof lead.calculator_inputs);
    console.log("Calculator results type:", typeof lead.calculator_results);
    console.log("API Version: 2.7"); // Updated version number
    
    // CRITICAL: Ensure calculator_results is an object not a string
    if (!lead.calculator_results) {
      console.error("Missing calculator_results");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing calculator_results",
          details: "The calculator_results property is required" 
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 400,
        }
      );
    }
    
    // NEW: Create a deep clone of the lead to avoid mutations affecting the original
    const sanitizedLead = JSON.parse(JSON.stringify(lead));
    
    if (typeof sanitizedLead.calculator_results === 'string') {
      try {
        sanitizedLead.calculator_results = JSON.parse(sanitizedLead.calculator_results);
        console.log("Successfully parsed calculator_results from string to object");
      } catch (e) {
        console.error("Failed to parse calculator_results from string:", e);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Invalid calculator_results: Failed to parse string: ${e.message}` 
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
            status: 400,
          }
        );
      }
    } else if (typeof sanitizedLead.calculator_results !== 'object') {
      console.error("Invalid calculator_results type:", typeof sanitizedLead.calculator_results);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid calculator_results: Expected object but got ${typeof sanitizedLead.calculator_results}` 
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 400,
        }
      );
    }
    
    // CRITICAL FIX: Ensure calculator_inputs is an object not a string
    if (sanitizedLead.calculator_inputs && typeof sanitizedLead.calculator_inputs === 'string') {
      try {
        sanitizedLead.calculator_inputs = JSON.parse(sanitizedLead.calculator_inputs);
        console.log("Successfully parsed calculator_inputs from string to object");
      } catch (e) {
        console.error("Failed to parse calculator_inputs from string:", e);
        // Continue without failing - inputs are less critical than results
        sanitizedLead.calculator_inputs = {};
      }
    }
    
    // Include version information if provided
    if (version) {
      sanitizedLead.version_info = {
        version_number: version,
        created_at: new Date().toISOString(),
        notes: `Version ${version}`
      };
      console.log("Added version info:", sanitizedLead.version_info);
    }
    
    // ENHANCED: Check for additionalVoiceMinutes in calculator_results
    if (sanitizedLead.calculator_results) {
      if (typeof sanitizedLead.calculator_results.additionalVoiceMinutes !== 'number') {
        console.log("additionalVoiceMinutes is not a number, type:", 
          typeof sanitizedLead.calculator_results.additionalVoiceMinutes);
          
        // Try to extract from calculator_inputs.callVolume if available
        if (sanitizedLead.calculator_inputs && 
            typeof sanitizedLead.calculator_inputs.callVolume !== 'undefined') {
          
          // Ensure it's a number
          const callVolume = typeof sanitizedLead.calculator_inputs.callVolume === 'string' 
            ? parseInt(sanitizedLead.calculator_inputs.callVolume, 10) || 0
            : Number(sanitizedLead.calculator_inputs.callVolume) || 0;
            
          console.log(`Setting additionalVoiceMinutes from callVolume: ${callVolume}`);
          sanitizedLead.calculator_results.additionalVoiceMinutes = callVolume;
        } else {
          // Default to 0 if not available
          console.log("Setting additionalVoiceMinutes to default value: 0");
          sanitizedLead.calculator_results.additionalVoiceMinutes = 0;
        }
      }
    }
    
    // DEBUG: Log key values we'll use in the proposal
    console.log("CRITICAL VALUES FOR PROPOSAL:");
    console.log("humanCostMonthly:", sanitizedLead.calculator_results.humanCostMonthly);
    console.log("aiCostMonthly.total:", sanitizedLead.calculator_results.aiCostMonthly?.total);
    console.log("monthlySavings:", sanitizedLead.calculator_results.monthlySavings);
    console.log("yearlySavings:", sanitizedLead.calculator_results.yearlySavings);
    console.log("savingsPercentage:", sanitizedLead.calculator_results.savingsPercentage);
    console.log("tierKey:", sanitizedLead.calculator_results.tierKey);
    console.log("aiType:", sanitizedLead.calculator_results.aiType);
    console.log("additionalVoiceMinutes:", sanitizedLead.calculator_results.additionalVoiceMinutes);
    console.log("Processing timestamp:", new Date().toISOString());
    
    // Determine if this is a preview or email request
    if (mode === "preview") {
      return handlePreviewRequest(sanitizedLead, returnContent, debug);
    } else if (mode === "email") {
      return handleEmailRequest(sanitizedLead);
    } else {
      console.error("Invalid mode:", mode);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid mode: ${mode}`,
          validModes: ["preview", "email"] 
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 400,
        }
      );
    }
  } catch (error) {
    // Log the error for debugging
    console.error("Error generating enhanced proposal:", error);
    
    // Return the error with version info
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        version: "2.7" // Updated version number
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
