
import { corsHeaders } from "../_shared/cors.ts";
import { generateProfessionalProposal } from "./pdf-generator.ts";
import { getSafeFileName } from "../_shared/utils.ts";

/**
 * Enhanced handler for preview mode requests, generating and returning a PDF for download
 */
export async function handlePreviewRequest(lead: any, shouldReturnContent: boolean = false, debug: boolean = false) {
  console.log("Generating enhanced preview PDF for download");
  
  try {
    // Get company name from lead data for the filename
    const companyName = lead.company_name || 'Client';
    // Sanitize company name for filename
    const safeCompanyName = getSafeFileName(companyName, { maxLength: 40, replaceChar: '-' });
    
    // Debug logging
    if (debug) {
      console.log("LEAD DATA FOR PDF GENERATION:");
      console.log("- company_name:", lead.company_name);
      console.log("- calculator_results sample:", JSON.stringify({
        humanCostMonthly: lead.calculator_results?.humanCostMonthly,
        aiCostMonthly: lead.calculator_results?.aiCostMonthly,
        monthlySavings: lead.calculator_results?.monthlySavings,
        additionalVoiceMinutes: lead.calculator_results?.additionalVoiceMinutes
      }, null, 2));
    }
    
    // CRITICAL: Validate calculator_results before proceeding
    if (!lead.calculator_results || typeof lead.calculator_results !== 'object') {
      console.error("Invalid calculator_results:", lead.calculator_results);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid calculator results data",
          details: "The calculator_results property is missing or not an object",
          version: "2.5"
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
    
    // ENHANCED VALIDATION: Check for all required properties and provide defaults if missing
    const validatedResults = validateAndSanitizeResults(lead.calculator_results, debug);
    
    // Replace the original results with the validated and sanitized version
    lead.calculator_results = validatedResults;
    
    if (debug) {
      console.log("Validated calculator_results:", JSON.stringify(validatedResults, null, 2));
    }
    
    // Create the PDF content - this needs to be a valid PDF string
    const pdfContent = generateProfessionalProposal(lead);
    
    if (!pdfContent || pdfContent.length < 100) {
      console.error("Generated PDF content is invalid or too short:", pdfContent?.substring(0, 50));
      throw new Error("Failed to generate valid PDF content");
    }
    
    console.log("PDF content generated successfully, length:", pdfContent.length);
    console.log("PDF starts with:", pdfContent.substring(0, 20)); // Check the first 20 chars
    
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
      
      // Ensure the content is properly encoded
      let encodedContent;
      
      try {
        // Check if content is a valid PDF
        if (!pdfContent.startsWith('%PDF-')) {
          console.error("Generated content is not a valid PDF");
          throw new Error("Failed to generate a valid PDF document");
        }
        
        // CRITICAL FIX: Proper base64 encoding for PDF content
        const encoder = new TextEncoder();
        const pdfBytes = encoder.encode(pdfContent);
        encodedContent = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
        
        console.log("Base64 encoding successful, length:", encodedContent.length);
      } catch (encodingError) {
        console.error("Error encoding PDF:", encodingError);
        throw new Error(`Failed to encode PDF content: ${encodingError.message}`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          pdf: encodedContent,
          format: 'base64',
          contentType: 'application/pdf',
          message: "Proposal generated successfully",
          version: "2.5", 
          timestamp: new Date().toISOString()
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
    
    // For preview, properly encode the PDF
    console.log("Encoding enhanced PDF for response");
    
    // Check if content is a valid PDF
    if (!pdfContent.startsWith('%PDF-')) {
      console.error("Generated content is not a valid PDF");
      throw new Error("Failed to generate a valid PDF document");
    }
    
    // CRITICAL FIX: Convert to base64 - crucial for PDF display in modern browsers
    const encoder = new TextEncoder();
    const pdfBytes = encoder.encode(pdfContent);
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
    
    if (debug) {
      console.log("Base64 encoding details:");
      console.log("- Original content length:", pdfContent.length);
      console.log("- Encoded content length:", base64Content.length);
      console.log("- First 30 chars of encoded content:", base64Content.substring(0, 30));
    }
    
    console.log("Base64 PDF created successfully, length:", base64Content.length);
    
    // Return the base64 encoded PDF with enhanced metadata
    return new Response(
      JSON.stringify({
        success: true,
        pdf: base64Content,
        format: 'base64',
        contentType: 'application/pdf',
        message: "Proposal generated successfully",
        version: "2.5", 
        timestamp: new Date().toISOString()
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
    console.error("Error generating enhanced PDF:", pdfError);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to generate PDF: " + pdfError.message,
        stack: pdfError.stack,
        version: "2.5"
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
 * Enhanced handler for email mode requests, sending the proposal via email
 */
export function handleEmailRequest(lead: any) {
  console.log("Enhanced proposal generation successful, returning response");
  
  return new Response(
    JSON.stringify({
      success: true,
      message: "Proposal has been sent to " + lead.email,
      timestamp: new Date().toISOString(),
      version: "2.5"
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

/**
 * NEW FUNCTION: Validates and sanitizes calculator results
 * Ensures all required properties exist and provides default values for missing ones
 */
function validateAndSanitizeResults(results: any, debug = false): any {
  if (debug) {
    console.log("Validating calculator results:", typeof results);
  }
  
  // Create a deep copy to avoid modifying the original object
  const sanitized = JSON.parse(JSON.stringify(results));
  
  // Ensure aiCostMonthly exists and has all required properties
  if (!sanitized.aiCostMonthly || typeof sanitized.aiCostMonthly !== 'object') {
    console.log("Creating missing aiCostMonthly object");
    sanitized.aiCostMonthly = {};
  }
  
  // Ensure all aiCostMonthly properties
  sanitized.aiCostMonthly.voice = typeof sanitized.aiCostMonthly.voice === 'number' ? 
    sanitized.aiCostMonthly.voice : 0;
    
  sanitized.aiCostMonthly.chatbot = typeof sanitized.aiCostMonthly.chatbot === 'number' ? 
    sanitized.aiCostMonthly.chatbot : 0;
    
  sanitized.aiCostMonthly.total = typeof sanitized.aiCostMonthly.total === 'number' ? 
    sanitized.aiCostMonthly.total : 0;
    
  sanitized.aiCostMonthly.setupFee = typeof sanitized.aiCostMonthly.setupFee === 'number' ? 
    sanitized.aiCostMonthly.setupFee : 749;
  
  // Ensure basic calculation properties exist
  sanitized.basePriceMonthly = typeof sanitized.basePriceMonthly === 'number' ? 
    sanitized.basePriceMonthly : 229;
    
  sanitized.humanCostMonthly = typeof sanitized.humanCostMonthly === 'number' ? 
    sanitized.humanCostMonthly : 0;
    
  sanitized.monthlySavings = typeof sanitized.monthlySavings === 'number' ? 
    sanitized.monthlySavings : 0;
    
  sanitized.yearlySavings = typeof sanitized.yearlySavings === 'number' ? 
    sanitized.yearlySavings : 0;
    
  sanitized.savingsPercentage = typeof sanitized.savingsPercentage === 'number' ? 
    sanitized.savingsPercentage : 0;
  
  // CRITICAL: Ensure additionalVoiceMinutes is properly set
  // Try to get it from the results directly
  if (typeof sanitized.additionalVoiceMinutes !== 'number') {
    // If it's a string, try to parse it as a number
    if (typeof sanitized.additionalVoiceMinutes === 'string') {
      console.log("Converting additionalVoiceMinutes from string to number");
      sanitized.additionalVoiceMinutes = parseInt(sanitized.additionalVoiceMinutes, 10) || 0;
    } else {
      // If it doesn't exist, calculate it from the voice cost or set to 0
      console.log("Setting missing additionalVoiceMinutes");
      sanitized.additionalVoiceMinutes = 
        sanitized.aiCostMonthly.voice > 0 ? 
        Math.round(sanitized.aiCostMonthly.voice / 0.12) : 0;
    }
  }
  
  if (debug) {
    console.log("AdditionalVoiceMinutes set to:", sanitized.additionalVoiceMinutes);
  }
  
  // Ensure tier and AI type are set
  sanitized.tierKey = sanitized.tierKey || "growth";
  sanitized.aiType = sanitized.aiType || "both";
  
  // Validate breakEvenPoint
  if (!sanitized.breakEvenPoint || typeof sanitized.breakEvenPoint !== 'object') {
    sanitized.breakEvenPoint = { voice: 0, chatbot: 0 };
  } else {
    sanitized.breakEvenPoint.voice = typeof sanitized.breakEvenPoint.voice === 'number' ? 
      sanitized.breakEvenPoint.voice : 0;
    sanitized.breakEvenPoint.chatbot = typeof sanitized.breakEvenPoint.chatbot === 'number' ? 
      sanitized.breakEvenPoint.chatbot : 0;
  }
  
  // Validate humanHours
  if (!sanitized.humanHours || typeof sanitized.humanHours !== 'object') {
    sanitized.humanHours = {
      dailyPerEmployee: 8,
      weeklyTotal: 40,
      monthlyTotal: 160,
      yearlyTotal: 2080
    };
  } else {
    sanitized.humanHours.dailyPerEmployee = typeof sanitized.humanHours.dailyPerEmployee === 'number' ? 
      sanitized.humanHours.dailyPerEmployee : 8;
    sanitized.humanHours.weeklyTotal = typeof sanitized.humanHours.weeklyTotal === 'number' ? 
      sanitized.humanHours.weeklyTotal : 40;
    sanitized.humanHours.monthlyTotal = typeof sanitized.humanHours.monthlyTotal === 'number' ? 
      sanitized.humanHours.monthlyTotal : 160;
    sanitized.humanHours.yearlyTotal = typeof sanitized.humanHours.yearlyTotal === 'number' ? 
      sanitized.humanHours.yearlyTotal : 2080;
  }
  
  // Ensure included voice minutes based on tier
  sanitized.includedVoiceMinutes = sanitized.tierKey === 'starter' ? 0 : 600;
  
  // Ensure annualPlan exists
  sanitized.annualPlan = typeof sanitized.annualPlan === 'number' ? 
    sanitized.annualPlan : sanitized.basePriceMonthly * 10;
  
  return sanitized;
}
