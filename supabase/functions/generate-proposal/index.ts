
// Follow Deno API reference at https://deno.land/api@v1.38.5
// Learn more about Supabase at https://supabase.com/docs/guides/functions/deno

import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { handleProposalGeneration, handleCorsRequest } from "./handlers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Proposal Edge Function - ${req.method} request received`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return handleCorsRequest();
  }

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      console.error(`Invalid method: ${req.method}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Method ${req.method} not allowed`,
          allowedMethods: ["POST", "OPTIONS"] 
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 405,
        }
      );
    }
    
    // Process the request
    console.log("Processing proposal generation request");
    return await handleProposalGeneration(req);
  } catch (error) {
    // Log the error for debugging
    console.error("Critical error in proposal function:", error);
    
    // Return the error with version info
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
        version: "2.8.1" // Updated version number
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
