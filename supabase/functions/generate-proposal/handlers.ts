
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
    
    // If returnContent flag is set, return the raw content instead of PDF 
    if (shouldReturnContent) {
      console.log("Returning raw proposal content as requested");
      return new Response(
        JSON.stringify({
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
    const isInvokeMethod = true; // Default to safer option
    console.log("Is using invoke method:", isInvokeMethod);
    
    if (isInvokeMethod) {
      console.log("Returning base64 encoded PDF for invoke method");
      // Convert to base64 for easy transmission through JSON
      const base64Content = btoa(pdfContent);
      return new Response(
        JSON.stringify(base64Content),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        }
      );
    } else {
      // For direct fetch, return the PDF as binary data
      console.log("Returning binary PDF for direct fetch");
      return new Response(
        pdfContent,
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="proposal-${safeCompanyName}.pdf"`,
          },
          status: 200,
        }
      );
    }
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
