
import { corsHeaders } from "../_shared/cors.ts";
import { generateProfessionalProposal } from "./pdf-generator.ts";
import { getSafeFileName } from "../_shared/utils.ts";

/**
 * Handles preview mode requests, generating and returning a PDF for download
 */
export async function handlePreviewRequest(lead: any, shouldReturnContent: boolean = false, debug: boolean = false) {
  console.log("Generating preview PDF for download");
  
  try {
    // Get company name from lead data for the filename
    const companyName = lead.company_name || 'Client';
    // Sanitize company name for filename
    const safeCompanyName = getSafeFileName(companyName);
    
    // Debug logging
    if (debug) {
      console.log("LEAD DATA FOR PDF GENERATION:");
      console.log("- company_name:", lead.company_name);
      console.log("- calculator_results sample:", JSON.stringify({
        humanCostMonthly: lead.calculator_results.humanCostMonthly,
        aiCostMonthly: lead.calculator_results.aiCostMonthly,
        monthlySavings: lead.calculator_results.monthlySavings
      }, null, 2));
    }
    
    // Create the PDF content
    const pdfContent = generateProfessionalProposal(lead);
    console.log("PDF content generated successfully, length:", pdfContent.length);
    
    // Enhanced debugging
    if (debug) {
      console.log("PDF CONTENT DIAGNOSTICS:");
      console.log("- Content type:", typeof pdfContent);
      console.log("- Content length:", pdfContent.length);
      console.log("- Starts with PDF header:", pdfContent.startsWith('%PDF-'));
      console.log("- First 50 chars:", pdfContent.substring(0, 50).replace(/\n/g, '\\n'));
    }
    
    // If returnContent flag is set, return the raw content instead of PDF 
    if (shouldReturnContent) {
      console.log("Returning raw proposal content as requested");
      return new Response(
        JSON.stringify({
          success: true,
          proposalContent: pdfContent,
          title: `Proposal for ${companyName}`,
          notes: `Generated proposal for ${companyName} on ${new Date().toLocaleString()}`,
          leadId: lead.id
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
    
    // For client.invoke() method, properly encode the PDF
    console.log("Encoding PDF for response");
    
    // Check if content is a valid PDF
    if (!pdfContent.startsWith('%PDF-')) {
      console.error("Generated content is not a valid PDF");
      throw new Error("Failed to generate a valid PDF document");
    }
    
    // Convert to base64 - crucial for PDF display in modern browsers
    const encoder = new TextEncoder();
    const pdfBytes = encoder.encode(pdfContent);
    
    // Use the proper method for base64 encoding in Deno
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
    
    if (debug) {
      console.log("Base64 encoding details:");
      console.log("- Original content length:", pdfContent.length);
      console.log("- Encoded content length:", base64Content.length);
      console.log("- First 30 chars of encoded content:", base64Content.substring(0, 30));
    }
    
    console.log("Base64 PDF created successfully, length:", base64Content.length);
    
    // Return the base64 encoded PDF - CRITICAL: format must be exactly as frontend expects
    return new Response(
      JSON.stringify({
        success: true,
        pdf: base64Content,
        format: 'base64',
        contentType: 'application/pdf',
        message: "Proposal generated successfully"
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (pdfError) {
    console.error("Error generating PDF:", pdfError);
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate PDF: " + pdfError.message,
        stack: pdfError.stack,
        success: false  // Explicitly mark as failed for frontend compatibility
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
}

/**
 * Handles email mode requests, sending the proposal via email
 */
export function handleEmailRequest(lead: any) {
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
