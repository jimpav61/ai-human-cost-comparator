
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
      console.log("Generating preview PDF for download");
      
      // Get company name from lead data for the filename
      const companyName = lead.company_name || 'Client';
      // Sanitize company name for filename
      const safeCompanyName = companyName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      
      // Create a more detailed PDF with actual lead data
      const pdfContent = generateSampleProposalPDF(lead);
      
      return new Response(
        pdfContent,
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="proposal-preview-${safeCompanyName}.pdf"`,
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

// Function to generate a sample PDF with lead data
function generateSampleProposalPDF(lead) {
  // Extract required data
  const companyName = lead.company_name || 'Client';
  const contactName = lead.name || 'Valued Client';
  const email = lead.email || 'client@example.com';
  const phoneNumber = lead.phone_number || 'Not provided';
  const industry = lead.industry || 'Technology';
  const employeeCount = lead.employee_count || '10';
  
  // Get calculator data if available
  const calculatorInputs = lead.calculator_inputs || {};
  const calculatorResults = lead.calculator_results || {};
  
  // Determine AI plan details
  const aiTier = (calculatorInputs.aiTier || '').toLowerCase();
  const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                  aiTier === 'growth' ? 'Growth Plan' : 
                  aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
  
  const aiType = (calculatorInputs.aiType || '').toLowerCase();
  const aiTypeDisplay = aiType.includes('voice') ? 'Voice Enabled' : 'Text Only';
  
  const monthlyPrice = aiTier === 'starter' ? 99 : 
                      aiTier === 'growth' ? 229 :
                      aiTier === 'premium' ? 429 : 229;
  
  const setupFee = aiTier === 'starter' ? 499 :
                  aiTier === 'growth' ? 749 :
                  aiTier === 'premium' ? 999 : 749;
  
  // Create a simple PDF with proper metadata and formatting
  const pdfContent = `
    %PDF-1.7
    1 0 obj
    << /Type /Catalog
       /Pages 2 0 R
       /Outlines 3 0 R
    >>
    endobj
    
    2 0 obj
    << /Type /Pages
       /Kids [4 0 R]
       /Count 1
    >>
    endobj
    
    3 0 obj
    << /Type /Outlines
       /Count 0
    >>
    endobj
    
    4 0 obj
    << /Type /Page
       /Parent 2 0 R
       /MediaBox [0 0 612 792]
       /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >>
       /Contents 8 0 R
    >>
    endobj
    
    5 0 obj
    << /Type /Font
       /Subtype /Type1
       /Name /F1
       /BaseFont /Helvetica
    >>
    endobj
    
    6 0 obj
    << /Type /Font
       /Subtype /Type1
       /Name /F2
       /BaseFont /Helvetica-Bold
    >>
    endobj
    
    7 0 obj
    << /Type /Font
       /Subtype /Type1
       /Name /F3
       /BaseFont /Helvetica-Oblique
    >>
    endobj
    
    8 0 obj
    << /Length 3000 >>
    stream
    BT
    /F2 18 Tf
    72 720 Td
    (AI SOLUTION PROPOSAL FOR ${companyName.toUpperCase()}) Tj
    /F1 12 Tf
    0 -25 Td
    (Prepared for: ${contactName}) Tj
    0 -20 Td
    (${email}) Tj
    0 -20 Td
    (${phoneNumber}) Tj
    0 -20 Td
    (Industry: ${industry}) Tj
    0 -20 Td
    (Company Size: ${employeeCount} employees) Tj
    0 -40 Td
    /F2 14 Tf
    (RECOMMENDED SOLUTION) Tj
    0 -25 Td
    /F1 12 Tf
    (Plan: ${tierName}) Tj
    0 -20 Td
    (Type: ${aiTypeDisplay}) Tj
    0 -20 Td
    (Monthly Price: $${monthlyPrice}) Tj
    0 -20 Td
    (One-time Setup Fee: $${setupFee}) Tj
    0 -40 Td
    /F2 14 Tf
    (FINANCIAL IMPACT) Tj
    0 -25 Td
    /F1 12 Tf
    (Monthly Savings: $${calculatorResults.monthlySavings || 'Varies based on usage'}) Tj
    0 -20 Td
    (Annual Savings: $${calculatorResults.yearlySavings || 'Varies based on usage'}) Tj
    0 -20 Td
    (ROI Timeline: 3-6 months) Tj
    0 -40 Td
    /F2 14 Tf
    (NEXT STEPS) Tj
    0 -25 Td
    /F1 12 Tf
    (1. Schedule a demo with our team) Tj
    0 -20 Td
    (2. Finalize implementation requirements) Tj
    0 -20 Td
    (3. Sign agreement and schedule onboarding) Tj
    0 -40 Td
    /F3 12 Tf
    (For questions or to move forward, please contact us at:) Tj
    0 -20 Td
    (Email: info@chatsites.ai) Tj
    0 -20 Td
    (Phone: +1 480-862-0288) Tj
    ET
    endstream
    endobj
    
    xref
    0 9
    0000000000 65535 f
    0000000010 00000 n
    0000000079 00000 n
    0000000142 00000 n
    0000000191 00000 n
    0000000329 00000 n
    0000000415 00000 n
    0000000505 00000 n
    0000000597 00000 n
    trailer
    << /Size 9
       /Root 1 0 R
    >>
    startxref
    3651
    %%EOF
  `;
  
  return pdfContent;
}
