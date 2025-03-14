
import { corsHeaders } from "../_shared/cors.ts";
import { generateProfessionalProposal } from "./pdf-generator.ts";
import { getSafeFileName } from "../_shared/utils.ts";

/**
 * Handle preview request for proposal generation
 */
export async function handlePreviewRequest(lead: any, returnContent = false, debug = false) {
  try {
    console.log("Generating PDF preview for lead:", lead.id);
    
    // Generate the PDF content
    const pdfContent = generateProfessionalProposal(lead);
    
    // Verify the PDF content starts with the PDF header
    if (!pdfContent.startsWith('%PDF-')) {
      console.error("CRITICAL ERROR: Generated content is not a valid PDF (missing %PDF- header)");
      throw new Error("Generated content is not a valid PDF");
    }
    
    // Log success
    console.log(`Successfully generated PDF preview (${pdfContent.length} bytes)`);
    
    // Determine what to return
    const response = {
      success: true,
      message: "Successfully generated proposal PDF",
      contentLength: pdfContent.length,
      contentStartsWith: pdfContent.substring(0, 20),
      // Only include content if explicitly requested
      content: returnContent ? pdfContent : undefined,
      // Include debug info if requested
      debug: debug ? {
        leadId: lead.id,
        companyName: lead.company_name,
        calculatorResultsType: typeof lead.calculator_results,
        hasCalculatorInputs: !!lead.calculator_inputs,
        apiVersion: "2.7"
      } : undefined
    };
    
    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error generating PDF preview:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        stage: "preview generation" 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      }
    );
  }
}

/**
 * Handle email request for proposal
 */
export async function handleEmailRequest(lead: any) {
  try {
    console.log("Email functionality not yet implemented");
    
    // Create a filename for the PDF
    const filename = getSafeFileName(lead.company_name);
    
    // Return success with placeholder message
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email functionality not yet implemented",
        filename: filename
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error in email handler:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        stage: "email sending" 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      }
    );
  }
}
