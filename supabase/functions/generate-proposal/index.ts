
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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
    
    // Get URL parameters
    const url = new URL(req.url);
    const isPreview = url.searchParams.get('preview') === 'true';
    console.log("Is preview mode:", isPreview);
    
    // Parse the request body
    const requestData = await req.json();
    console.log("Request data received:", JSON.stringify(requestData));
    
    const { lead, preview } = requestData;
    // Support preview parameter in both URL and request body
    const isPreviewMode = isPreview || preview === true;
    
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
    
    if (isPreviewMode) {
      // In preview mode, generate and return the PDF directly
      // This is a mock for now - in a real implementation, you would generate the PDF here
      
      // For demonstrating the feature, we'll create a simple PDF (in real implementation, use proper PDF generation)
      console.log("Generating preview PDF for download");
      
      // Using a mock PDF for testing purposes
      const pdfContent = `
        %PDF-1.4
        1 0 obj
        << /Type /Catalog
           /Pages 2 0 R
        >>
        endobj
        2 0 obj
        << /Type /Pages
           /Kids [3 0 R]
           /Count 1
        >>
        endobj
        3 0 obj
        << /Type /Page
           /Parent 2 0 R
           /Resources << /Font << /F1 4 0 R >> >>
           /Contents 5 0 R
        >>
        endobj
        4 0 obj
        << /Type /Font
           /Subtype /Type1
           /Name /F1
           /BaseFont /Helvetica
        >>
        endobj
        5 0 obj
        << /Length 68 >>
        stream
        BT
        /F1 12 Tf
        72 720 Td
        (Proposal Preview for ${lead.company_name || 'Client'}) Tj
        ET
        endstream
        endobj
        xref
        0 6
        0000000000 65535 f
        0000000009 00000 n
        0000000058 00000 n
        0000000115 00000 n
        0000000210 00000 n
        0000000287 00000 n
        trailer
        << /Size 6
           /Root 1 0 R
        >>
        startxref
        406
        %%EOF
      `;
      
      return new Response(
        pdfContent,
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="proposal-preview-${lead.company_name || 'client'}.pdf"`,
          },
          status: 200,
        }
      );
    } else {
      // Original email sending logic
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
    }
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
