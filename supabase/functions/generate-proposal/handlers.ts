import { ProposalData, extractProposalData } from "./pdf-data-extractor.ts";
import { generateProfessionalProposal } from "./pdf-generator.ts";
import { isValidPdf, debugLog } from "./pdf-utils.ts";

/**
 * Proposal generation handler - main entry point
 */
export async function handleProposalGeneration(req: Request): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
    
    // Parse request body
    const { lead, mode = "preview", returnContent = true, debug = false } = await req.json();
    
    debugLog("Proposal Request", { leadId: lead?.id, mode, returnContent, debug });
    
    // Validate input data
    if (!lead || !lead.id || !lead.company_name) {
      throw new Error("Missing required lead data: id and company_name");
    }
    
    // Create a deep copy to ensure we don't mutate the original object
    const processedLead = JSON.parse(JSON.stringify(lead));
    
    // Ensure calculator_inputs is properly parsed if it's a string
    if (typeof processedLead.calculator_inputs === 'string') {
      try {
        processedLead.calculator_inputs = JSON.parse(processedLead.calculator_inputs);
        console.log("Parsed calculator_inputs string to object");
      } catch (e) {
        console.error("Failed to parse calculator_inputs:", e);
        // Keep as string if parsing fails
      }
    }
    
    // Ensure calculator_results is properly parsed if it's a string
    if (typeof processedLead.calculator_results === 'string') {
      try {
        processedLead.calculator_results = JSON.parse(processedLead.calculator_results);
        console.log("Parsed calculator_results string to object");
      } catch (e) {
        console.error("Failed to parse calculator_results:", e);
        // Keep as string if parsing fails
      }
    }
    
    // Log the lead data for debugging
    if (debug) {
      console.log('Lead data after processing:', {
        id: processedLead.id,
        company: processedLead.company_name,
        calculator_inputs: processedLead.calculator_inputs ? 
          (typeof processedLead.calculator_inputs === 'object' ? 
           Object.keys(processedLead.calculator_inputs) : 
           typeof processedLead.calculator_inputs) : "missing",
        calculator_results: processedLead.calculator_results ? 
          (typeof processedLead.calculator_results === 'object' ? 
           Object.keys(processedLead.calculator_results) : 
           typeof processedLead.calculator_results) : "missing"
      });
    }
    
    // Generate the PDF proposal
    const pdfContent = generateProfessionalProposal(processedLead);
    
    // Validate the generated PDF content
    if (!isValidPdf(pdfContent)) {
      console.error("Generated content is not a valid PDF!");
      throw new Error("Failed to generate a valid PDF document");
    }
    
    console.log(`PDF generated successfully for ${processedLead.company_name} (${processedLead.id})`);
    
    // Prepare the response
    const response = {
      success: true,
      message: "Proposal generated successfully",
      leadId: processedLead.id
    };
    
    // Add the PDF content to the response if requested
    if (returnContent) {
      response["pdf"] = pdfContent;
    }
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error handling proposal generation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        }
      }
    );
  }
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsRequest(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Max-Age': '86400',
    }
  });
}
