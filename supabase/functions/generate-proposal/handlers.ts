
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
    
    // Log the lead data for debugging
    if (debug) {
      console.log('Lead data received:', {
        id: lead.id,
        company: lead.company_name,
        calculator_results: lead.calculator_results ? Object.keys(lead.calculator_results) : "missing"
      });
    }
    
    // Generate the PDF proposal
    const pdfContent = generateProfessionalProposal(lead);
    
    // Validate the generated PDF content
    if (!isValidPdf(pdfContent)) {
      console.error("Generated content is not a valid PDF!");
      throw new Error("Failed to generate a valid PDF document");
    }
    
    console.log(`PDF generated successfully for ${lead.company_name} (${lead.id})`);
    
    // Prepare the response
    const response = {
      success: true,
      message: "Proposal generated successfully",
      leadId: lead.id
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
