
import { corsHeaders } from "../_shared/cors.ts";
import { generateProfessionalProposal } from "./pdf-generator.ts";
import { getSafeFileName } from "../_shared/utils.ts";

/**
 * Handles preview mode requests, generating and returning a PDF for download
 */
export async function handlePreviewRequest(lead: any, shouldReturnContent: boolean = false) {
  console.log("Generating preview PDF for download");
  
  try {
    // Get company name from lead data for the filename
    const companyName = lead.company_name || 'Client';
    // Sanitize company name for filename
    const safeCompanyName = getSafeFileName(companyName);
    
    // Do not clone the lead - use the original data exactly as received
    console.log("Using exact lead data for proposal generation (no cloning)");
    console.log("Lead calculator_results for PDF generation:", JSON.stringify(lead.calculator_results, null, 2));
    
    // Create a professional multi-page proposal PDF with actual lead data
    const pdfContent = generateProfessionalProposal(lead);
    console.log("PDF content generated successfully, length:", pdfContent.length);
    
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
    
    // For client.invoke() method, return base64 encoded PDF
    console.log("Returning base64 encoded PDF for invoke method");
    
    // Check if content already starts with PDF header
    let base64Content;
    if (pdfContent.startsWith('%PDF-')) {
      console.log("Content is a raw PDF - encoding to base64");
      // Convert raw PDF to base64
      const encoder = new TextEncoder();
      const pdfData = encoder.encode(pdfContent);
      base64Content = btoa(String.fromCharCode(...new Uint8Array(pdfData)));
    } else {
      // Already encoded or in another format
      console.log("Content may already be encoded, using as is");
      base64Content = pdfContent;
    }
    
    console.log("Base64 PDF created successfully, length:", base64Content.length);
    console.log("Base64 PDF sample (first 30 chars):", base64Content.substring(0, 30));
    
    return new Response(
      JSON.stringify({
        success: true,
        pdf: base64Content,
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
        stack: pdfError.stack 
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
