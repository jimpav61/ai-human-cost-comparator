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
    console.log("Request method:", req.method);
    console.log("Request headers:", JSON.stringify(Object.fromEntries([...req.headers]), null, 2));
    
    // Get URL parameters
    const url = new URL(req.url);
    const isPreview = url.searchParams.get('preview') === 'true';
    console.log("Is preview mode (from URL):", isPreview);
    
    // Parse the request body
    const requestData = await req.json();
    console.log("Request data keys:", Object.keys(requestData));
    
    const { lead, preview, saveRevision, returnContent } = requestData;
    // Support preview parameter in both URL and request body
    const isPreviewMode = isPreview || preview === true;
    // Flag to determine if we should return the raw content instead of PDF
    const shouldReturnContent = returnContent === true;
    console.log("Final preview mode:", isPreviewMode);
    console.log("Return content flag:", shouldReturnContent);
    
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
    
    // Log calculator data to troubleshoot
    console.log("Lead calculator_inputs:", JSON.stringify(lead.calculator_inputs, null, 2));
    console.log("Lead calculator_results:", JSON.stringify(lead.calculator_results, null, 2));
    
    // Ensure calculator data exists and is properly formatted
    if (!lead.calculator_inputs || typeof lead.calculator_inputs !== 'object') {
      lead.calculator_inputs = {};
    }
    
    if (!lead.calculator_results || typeof lead.calculator_results !== 'object') {
      lead.calculator_results = {};
    }
    
    // Process lead data with the same logic used in report generation
    const processedLead = await processLeadData(lead);
    console.log("Processed lead data for proposal generation:", JSON.stringify(processedLead, null, 2));
    
    if (isPreviewMode) {
      // In preview mode, generate and return the PDF directly
      console.log("Generating preview PDF for download");
      
      try {
        // Get company name from lead data for the filename
        const companyName = processedLead.company_name || 'Client';
        // Sanitize company name for filename
        const safeCompanyName = companyName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        
        // Create a professional multi-page proposal PDF with actual lead data
        const pdfContent = generateProfessionalProposal(processedLead);
        
        // If returnContent flag is set, return the raw content instead of PDF
        if (shouldReturnContent) {
          console.log("Returning raw proposal content as requested");
          return new Response(
            JSON.stringify({
              proposalContent: pdfContent,
              title: `Proposal for ${companyName}`,
              notes: `Generated proposal for ${companyName} on ${new Date().toLocaleString()}`,
              leadId: processedLead.id
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
        const isInvokeMethod = req.headers.get('x-client-info')?.includes('supabase');
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
    } else {
      // Original email sending logic
      console.log("Proposal generation successful, returning response");
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Proposal has been sent to " + processedLead.email,
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
    console.error("Error in proposal generation:", error.message);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({
        error: "Failed to generate proposal: " + error.message,
        stack: error.stack,
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

// Process lead data with the same logic used in report generation
async function processLeadData(lead) {
  console.log("Processing lead data for proposal generation");
  
  // Ensure we have a deep copy to prevent reference issues
  const processedLead = JSON.parse(JSON.stringify(lead));
  
  // Set default calculator inputs if not present
  if (!processedLead.calculator_inputs || Object.keys(processedLead.calculator_inputs).length === 0) {
    console.log("Creating default calculator_inputs");
    processedLead.calculator_inputs = {
      aiTier: processedLead.calculator_results?.tierKey || 'growth',
      aiType: processedLead.calculator_results?.aiType || 'both',
      callVolume: 0,
      role: 'customerService',
      numEmployees: 1, // Always use 1 employee for 1:1 replacement
      chatVolume: 2000,
      avgCallDuration: 0,
      avgChatLength: 0,
      avgChatResolutionTime: 0
    };
  }
  
  // Always set numEmployees to 1 for the 1:1 replacement model
  if (processedLead.calculator_inputs) {
    processedLead.calculator_inputs.numEmployees = 1;
    console.log("Set numEmployees to 1 for 1:1 replacement model");
  }
  
  // Ensure callVolume is a number
  if (processedLead.calculator_inputs && typeof processedLead.calculator_inputs.callVolume === 'string') {
    processedLead.calculator_inputs.callVolume = parseInt(processedLead.calculator_inputs.callVolume, 10) || 0;
    console.log("Converted callVolume from string to number:", processedLead.calculator_inputs.callVolume);
  }
  
  // Recalculate results using 1:1 replacement model
  if (processedLead.calculator_inputs) {
    try {
      console.log("Recalculating results with 1:1 replacement model");
      processedLead.calculator_results = performCalculations(processedLead.calculator_inputs);
      console.log("Recalculated results:", processedLead.calculator_results);
    } catch (error) {
      console.error("Error recalculating results:", error);
    }
  }
  
  return processedLead;
}

// ===== CALCULATION FUNCTIONS FROM calculator/calculations.ts =====
// These were copied directly from the report generator's calculation logic

// Constants for time calculations
const HOURS_PER_SHIFT = 8;
const DAYS_PER_WEEK = 5;
const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

// Hardcoded base prices to ensure consistency
const HARDCODED_BASE_PRICES = {
  starter: 99,
  growth: 229,
  premium: 429
};

// Human hourly rates for each role
const HUMAN_HOURLY_RATES = {
  customerService: 22,
  sales: 28,
  technicalSupport: 30,
  generalAdmin: 24
};

// Validate calculator inputs and provide defaults
function validateInputs(inputs) {
  console.log("Validating calculator inputs:", inputs);
  
  // Ensure aiType is consistent with aiTier
  let aiType = inputs.aiType || 'chatbot';
  const aiTier = inputs.aiTier || 'starter';
  
  // Force consistent AI type values based on tier
  if (aiTier === 'starter' && aiType !== 'chatbot') {
    aiType = 'chatbot';
    console.log("Starter plan can only use chatbot - corrected aiType to:", aiType);
  } else if (aiTier === 'premium') {
    if (aiType === 'voice') {
      aiType = 'conversationalVoice';
      console.log("Premium plan upgraded voice to conversational - corrected aiType to:", aiType);
    } else if (aiType === 'both') {
      aiType = 'both-premium';
      console.log("Premium plan upgraded voice features - corrected aiType to:", aiType);
    }
  } else if (aiTier === 'growth') {
    if (aiType === 'conversationalVoice') {
      aiType = 'voice';
      console.log("Growth plan can only use basic voice - corrected aiType to:", aiType);
    } else if (aiType === 'both-premium') {
      aiType = 'both';
      console.log("Growth plan can only use basic voice features - corrected aiType to:", aiType);
    }
  }
  
  // CRITICAL: Always calculate based on replacing ONE employee, regardless of total employees
  const validatedInputs = {
    aiType: aiType,
    aiTier: aiTier,
    role: inputs.role || 'customerService',
    numEmployees: 1, // Force to 1 for calculations
    callVolume: inputs.callVolume || 0,
    avgCallDuration: 0,
    chatVolume: inputs.chatVolume || 2000,
    avgChatLength: 0,
    avgChatResolutionTime: 0
  };
  
  console.log("Validated calculator inputs (forcing 1:1 replacement):", validatedInputs);
  return validatedInputs;
}

// Calculate human resource metrics based on total employees minus one (replaced by AI)
function calculateHumanResources(inputs) {
  // Always calculate for ONE employee only, regardless of total employees
  const employeesAfterAI = 1; // We're replacing exactly one employee
  const dailyHoursPerEmployee = HOURS_PER_SHIFT;
  const weeklyHoursPerEmployee = dailyHoursPerEmployee * DAYS_PER_WEEK;
  const weeklyTotalHours = weeklyHoursPerEmployee * employeesAfterAI;
  const monthlyTotalHours = (weeklyTotalHours * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
  const yearlyTotalHours = weeklyTotalHours * WEEKS_PER_YEAR;
  
  return {
    dailyPerEmployee: dailyHoursPerEmployee,
    weeklyTotal: weeklyTotalHours,
    monthlyTotal: monthlyTotalHours,
    yearlyTotal: yearlyTotalHours
  };
}

// Calculate human resource costs based on remaining employees after AI replacement
function calculateHumanCosts(inputs, monthlyHours) {
  const baseHourlyRate = HUMAN_HOURLY_RATES[inputs.role];
  const hourlyRateWithBenefits = baseHourlyRate * 1.3; // Add 30% for benefits
  const monthlyHumanCost = hourlyRateWithBenefits * monthlyHours;
  
  return {
    hourlyRate: baseHourlyRate,
    hourlyRateWithBenefits,
    monthlyHumanCost
  };
}

// Calculate AI costs and pricing details
function calculateAICosts(inputs) {
  console.log("Calculating AI costs with inputs:", inputs);
  
  // Get the exact fixed price for the selected tier
  const tierBase = HARDCODED_BASE_PRICES[inputs.aiTier];
  console.log("Tier base price:", tierBase, "for tier:", inputs.aiTier);
  
  // Calculate additional voice costs - input field is now the ADDITIONAL minutes
  let additionalVoiceCost = 0;
  const includedVoiceMinutes = inputs.aiTier === 'starter' ? 0 : 600;
  
  // inputs.callVolume now directly represents the additional minutes
  const extraVoiceMinutes = inputs.callVolume;
  console.log("Extra voice minutes:", extraVoiceMinutes, "Included minutes:", includedVoiceMinutes);
  
  if (extraVoiceMinutes > 0 && inputs.aiTier !== 'starter') {
    // Always use 12¢ per minute for additional voice minutes
    const additionalMinuteRate = 0.12;
    additionalVoiceCost = extraVoiceMinutes * additionalMinuteRate;
    console.log("Additional voice cost:", additionalVoiceCost);
  }
  
  // Calculate setup fee
  const setupFee = inputs.aiTier === 'starter' ? 499 : inputs.aiTier === 'growth' ? 749 : 999;
  
  // Calculate annual plan price
  const annualPlan = inputs.aiTier === 'starter' ? 990 : inputs.aiTier === 'growth' ? 2290 : 4290;
  
  // Total monthly cost
  const totalMonthlyCost = tierBase + additionalVoiceCost;
  console.log("Total monthly cost:", totalMonthlyCost);
  
  return {
    tierBase,
    additionalVoiceCost,
    setupFee,
    annualPlan,
    totalMonthlyCost,
    extraVoiceMinutes
  };
}

// Calculate savings and percentages based on one employee replacement
function calculateSavings(humanCost, aiCost) {
  const monthlySavings = humanCost - aiCost;
  const yearlySavings = monthlySavings * 12;
  const savingsPercentage = humanCost > 0 ? (monthlySavings / humanCost) * 100 : 0;
  
  return {
    monthlySavings,
    yearlySavings,
    savingsPercentage
  };
}

// Calculate breakeven points
function calculateBreakEvenPoints(inputs, humanCosts, aiCosts) {
  return {
    voice: aiCosts.extraVoiceMinutes,
    chatbot: Math.ceil(aiCosts.totalMonthlyCost / ((humanCosts.hourlyRateWithBenefits) / 60))
  };
}

// Perform the full calculation and return the results
function performCalculations(inputs) {
  console.log("Performing full calculations with inputs:", inputs, "Using one employee replacement model");
  
  const validatedInputs = validateInputs(inputs);
  const humanHours = calculateHumanResources(validatedInputs);
  const humanCosts = calculateHumanCosts(validatedInputs, humanHours.monthlyTotal);
  const aiCosts = calculateAICosts(validatedInputs);
  const savings = calculateSavings(humanCosts.monthlyHumanCost, aiCosts.totalMonthlyCost);
  const breakEvenPoint = calculateBreakEvenPoints(validatedInputs, humanCosts, aiCosts);
  
  const results = {
    aiCostMonthly: {
      voice: aiCosts.additionalVoiceCost,
      chatbot: aiCosts.tierBase,
      total: aiCosts.totalMonthlyCost,
      setupFee: aiCosts.setupFee
    },
    basePriceMonthly: aiCosts.tierBase,
    humanCostMonthly: humanCosts.monthlyHumanCost,
    monthlySavings: savings.monthlySavings,
    yearlySavings: savings.yearlySavings,
    savingsPercentage: savings.savingsPercentage,
    breakEvenPoint: breakEvenPoint,
    humanHours: humanHours,
    annualPlan: aiCosts.annualPlan,
    tierKey: validatedInputs.aiTier,
    aiType: validatedInputs.aiType
  };
  
  console.log("Final calculation results (one employee replacement model):", results);
  return results;
}

// Function to generate a professional, multi-page proposal PDF with lead data
function generateProfessionalProposal(lead) {
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
  
  // Determine AI plan details from inputs
  // Default to growth plan if no tier is specified
  const aiTier = (calculatorInputs.aiTier || calculatorResults.tierKey || 'growth').toLowerCase();
  console.log("Proposal generation - AI Tier:", aiTier);
  
  // Get display names based on tier
  const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                  aiTier === 'growth' ? 'Growth Plan' : 
                  aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
  
  // Set AI type display based on tier and type
  let aiTypeDisplay = 'Text Only';
  if (calculatorInputs.aiType) {
    const aiType = calculatorInputs.aiType;
    console.log("Proposal generation - AI Type:", aiType);
    aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                    aiType === 'voice' ? 'Basic Voice' : 
                    aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                    aiType === 'both' ? 'Text & Basic Voice' : 
                    aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
  } else if (calculatorResults.aiType) {
    const aiType = calculatorResults.aiType;
    console.log("Proposal generation - AI Type from results:", aiType);
    aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                    aiType === 'voice' ? 'Basic Voice' : 
                    aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                    aiType === 'both' ? 'Text & Basic Voice' : 
                    aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
  } else if (aiTier !== 'starter') {
    // If no AI type specified but not on starter, default to voice capability
    aiTypeDisplay = 'Text & Basic Voice';
  }
  
  // Get setup fees
  const setupFee = calculatorResults.aiCostMonthly?.setupFee ||
                  (aiTier === 'starter' ? 249 :
                   aiTier === 'growth' ? 749 :
                   aiTier === 'premium' ? 1149 : 749);
  
  // Get voice details - different for each tier
  const includedVoiceMinutes = aiTier === 'starter' ? 0 : 600;
  
  // Get additional voice minutes from calculator inputs
  let additionalVoiceMinutes = 0;
  if (aiTier !== 'starter') {
    if (calculatorInputs && typeof calculatorInputs.callVolume !== 'undefined') {
      additionalVoiceMinutes = Number(calculatorInputs.callVolume);
      console.log("Using additional voice minutes from inputs:", additionalVoiceMinutes);
    }
  }
  
  console.log("Final additional voice minutes:", additionalVoiceMinutes);
  
  // Use exact values from calculator_results
  const humanCostMonthly = calculatorResults.humanCostMonthly !== undefined 
    ? calculatorResults.humanCostMonthly 
    : 5000; // Single employee cost fallback
  
  const totalMonthlyCost = calculatorResults.aiCostMonthly?.total !== undefined
    ? calculatorResults.aiCostMonthly.total
    : (aiTier === 'starter' ? 99 : aiTier === 'growth' ? 229 : 429) + (additionalVoiceMinutes * 0.12);
  
  const monthlySavings = calculatorResults.monthlySavings !== undefined
    ? calculatorResults.monthlySavings
    : (humanCostMonthly - totalMonthlyCost);
  
  const yearlySavings = calculatorResults.yearlySavings !== undefined
    ? calculatorResults.yearlySavings
    : (monthlySavings * 12);
  
  const savingsPercentage = calculatorResults.savingsPercentage !== undefined
    ? calculatorResults.savingsPercentage
    : (humanCostMonthly > 0 ? Math.round((monthlySavings / humanCostMonthly) * 100) : 50);
  
  const annualPlan = calculatorResults.annualPlan !== undefined
    ? calculatorResults.annualPlan
    : (totalMonthlyCost * 10);
  
  // Log the final values for the proposal to verify correct usage
  console.log("FINAL PROPOSAL VALUES:");
  console.log("humanCostMonthly:", humanCostMonthly);
  console.log("totalMonthlyCost:", totalMonthlyCost);
  console.log("monthlySavings:", monthlySavings);
  console.log("yearlySavings:", yearlySavings);
  console.log("savingsPercentage:", savingsPercentage);
  console.log("setupFee:", setupFee);
  console.log("annualPlan:", annualPlan);
  console.log("additionalVoiceMinutes:", additionalVoiceMinutes);
  
  // Calculate ROI details with proper values
  const breakEvenPoint = Math.ceil(setupFee / (monthlySavings || 1000));
  const firstYearROI = Math.round((yearlySavings - setupFee) / setupFee * 100);
  const fiveYearSavings = yearlySavings * 5;
  
  // Generate current date for the proposal
  const today = new Date();
  const formattedDate = `${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}, ${today.getFullYear()}`;
  
  // Format all monetary values for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Brand Colors
  const brandRed = "#ff432a";  // Main brand color
  const brandDarkBlue = "#1a202c"; // Dark blue for headings
  
  // KEEP THE EXACT SAME PDF GENERATION CODE TO MAINTAIN THE SAME FORMATTING
  // ... keep existing code for PDF generation
  let pdfContent = `
%PDF-1.7
1 0 obj
<< /Type /Catalog
   /Pages 2 0 R
   /Outlines 3 0 R
>>
endobj

2 0 obj
<< /Type /Pages
   /Kids [4 0 R 8 0 R 12 0 R 16 0 R]
   /Count 4
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
   /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> 
                /ExtGState << /GS1 30 0 R /GS2 31 0 R /GS3 32 0 R >> >>
   /Contents 20 0 R
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
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 612 792]
   /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> 
                /ExtGState << /GS1 30 0 R /GS2 31 0 R /GS3 32 0 R >> >>
   /Contents 21 0 R
>>
endobj

12 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 612 792]
   /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> 
                /ExtGState << /GS1 30 0 R /GS2 31 0 R /GS3 32 0 R >> >>
   /Contents 22 0 R
>>
endobj

16 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 612 792]
   /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> 
                /ExtGState << /GS1 30 0 R /GS2 31 0 R /GS3 32 0 R >> >>
   /Contents 23 0 R
>>
endobj

20 0 obj
<< /Length 3300 >>
stream
q
${brandRed} rg
0 792 612 -70 re f
0 0 0 rg
BT
/F2 28 Tf
72 740 Td
1 1 1 rg
(AI SOLUTION PROPOSAL) Tj
0 0 0 rg
/F1 12 Tf
0 -36 Td
(Prepared exclusively for ${companyName}) Tj
/F2 18 Tf
0 -50 Td
${brandRed} rg
(EXECUTIVE SUMMARY) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(Dear ${contactName},) Tj
0 -20 Td
(Thank you for the opportunity to present our AI solution proposal for ${companyName}. At ChatSites.ai, we) Tj
0 -20 Td
(specialize in developing cutting-edge conversational AI solutions that drive operational efficiency and) Tj
0 -20 Td
(enhance customer experiences across industries.) Tj
0 -40 Td
/F2 16 Tf
${brandRed} rg
(KEY BENEFITS) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf

(\\267 Reduction in operational costs by up to ${Math.round(savingsPercentage)}%) Tj
0 -20 Td
(\\267 Estimated annual savings of ${formatCurrency(yearlySavings)}) Tj
0 -20 Td
(\\267 24/7 customer service availability without additional staffing costs) Tj
0 -20 Td
(\\267 Improved response times and consistency in customer communications) Tj
0 -20 Td
(\\267 Scalable solution that grows with your business needs) Tj
0 0 0 rg
0 -40 Td
/F2 16 Tf
${brandRed} rg
(CONTACT INFORMATION) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(${contactName}) Tj
0 -20 Td
(${companyName}) Tj
0 -20 Td
(${email}) Tj
0 -20 Td
(${phoneNumber}) Tj

BT
/F2 14 Tf
72 90 Td
${brandRed} rg
(Selected Plan: ${tierName} - ${aiTypeDisplay}) Tj
0 0 0 rg
ET
Q
endstream
endobj

21 0 obj
<< /Length 3500 >>
stream
q
${brandRed} rg
0 792 612 -70 re f
0 0 0 rg
BT
/F2 24 Tf
72 740 Td
1 1 1 rg
(RECOMMENDED SOLUTION) Tj
0 0 0 rg
0 -45 Td
/F2 18 Tf
${brandRed} rg
(${tierName} - ${aiTypeDisplay}) Tj
0 0 0 rg
0 -30 Td
/F1 12 Tf
(Based on your specific business requirements, we recommend our ${tierName} with) Tj
0 -20 Td
(${aiTypeDisplay} capabilities as the optimal solution for ${companyName}.) Tj
0 -40 Td
/F2 16 Tf
${brandRed} rg
(Solution Features:) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(\\267 Customized AI model trained on your business knowledge and processes) Tj
0 -20 Td
(\\267 Advanced natural language processing for accurate understanding of customer inquiries) Tj
0 -20 Td
(\\267 ${aiTypeDisplay} interface for versatile customer engagement) Tj
0 -20 Td
(\\267 Integration capabilities with your existing systems and workflows) Tj
0 -20 Td
(\\267 Comprehensive analytics dashboard for performance monitoring) Tj
0 -20 Td
(\\267 Regular updates and continuous improvement of AI capabilities) Tj
0 0 0 rg
0 -40 Td
/F2 16 Tf
${brandRed} rg
(Technical Specifications:) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(\\267 ${tierName} AI Engine with ${aiTier === 'premium' ? 'advanced' : aiTier === 'growth' ? 'enhanced' : 'standard'} capabilities) Tj
0 -20 Td
(\\267 ${aiTypeDisplay} Interface ${aiTier !== 'starter' ? 'with speech recognition and synthesis' : ''}) Tj
0 -20 Td`;

  // Add voice information - handle both starter and non-starter tiers clearly
  if (aiTier === 'starter') {
    pdfContent += `
(\\267 No voice capabilities included in this tier) Tj
0 -20 Td`;
  } else {
    pdfContent += `
(\\267 Includes ${includedVoiceMinutes} voice minutes per month as part of base plan) Tj
0 -20 Td`;
    
    // Always show additional voice minutes information clearly
    if (additionalVoiceMinutes > 0) {
      pdfContent += `
(\\267 ${additionalVoiceMinutes} additional voice minutes at $0.12/minute) Tj
0 -20 Td
(\\267 Additional voice cost: $${(additionalVoiceMinutes * 0.12).toFixed(2)}/month) Tj
0 -20 Td`;
    } else {
      pdfContent += `
(\\267 No additional voice minutes requested) Tj
0 -20 Td`;
    }
  }

  // Continue with standard content (adjust positioning to prevent overflow)
  pdfContent += `
(\\267 ${aiTier === 'premium' ? 'Unlimited' : '50,000+'} monthly text interactions) Tj
0 -20 Td
(\\267 Secure cloud-based deployment with 99.9% uptime guarantee) Tj
0 -20 Td
(\\267 ${aiTier === 'premium' ? 'Priority' : 'Standard'} technical support and maintenance) Tj
0 -30 Td

BT
/F2 16 Tf
72 195 Td
${brandRed} rg
(Implementation Timeline:) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(\\267 Discovery and Planning: 1 week) Tj
0 -20 Td
(\\267 Development and Customization: 2-3 weeks) Tj
0 -20 Td
(\\267 Testing and Quality Assurance: 1 week) Tj
0 -20 Td
(\\267 Deployment and Integration: 1 week) Tj
0 -20 Td
(\\267 Training and Knowledge Transfer: 1 week) Tj
ET
Q
endstream
endobj

22 0 obj
<< /Length 3700 >>
stream
q
${brandRed} rg
0 792 612 -70 re f
0 0 0 rg
BT
/F2 24 Tf
72 740 Td
1 1 1 rg
(FINANCIAL IMPACT) Tj
0 0 0 rg
0 -45 Td
/F2 18 Tf
${brandRed} rg
(Investment Details) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Monthly Base Price:) Tj
190 0 Td
($${(totalMonthlyCost - (additionalVoiceMinutes * 0.12)).toFixed(2)}/month) Tj
-190 -25 Td
(Setup and Onboarding Fee:) Tj
190 0 Td
($${setupFee.toFixed(2)} one-time) Tj
-190 -25 Td`;

  // Handle voice minutes information clearly - different for starter vs other tiers
  if (aiTier === 'starter') {
    pdfContent += `
(Voice Capabilities:) Tj
190 0 Td
(Not included in Starter Plan) Tj
-190 -25 Td`;
  } else {
    pdfContent += `
(Included Voice Minutes:) Tj
190 0 Td
(${includedVoiceMinutes} minutes/month) Tj
-190 -25 Td`;
    
    // Explicit display of additional voice minutes with clear formatting
    if (additionalVoiceMinutes > 0) {
      pdfContent += `
(Additional Voice Minutes:) Tj
190 0 Td
(${additionalVoiceMinutes} minutes @ $0.12/minute) Tj
-190 -25 Td
(Additional Voice Cost:) Tj
190 0 Td
($${(additionalVoiceMinutes * 0.12).toFixed(2)}/month) Tj
-190 -25 Td`;
    } else {
      pdfContent += `
(Additional Voice Minutes:) Tj
190 0 Td
(None requested) Tj
-190 -25 Td`;
    }
  }

  // Show total monthly cost with clear breakdown
  pdfContent += `
(Total Monthly Investment:) Tj
190 0 Td
($${totalMonthlyCost.toFixed(2)}/month) Tj
-190 -25 Td
(Annual Investment:) Tj
190 0 Td
($${annualPlan.toFixed(2)}/year (2 months free with annual plan)) Tj
-190 -45 Td

/F2 18 Tf
${brandRed} rg
(Cost Comparison and Savings) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Current Estimated Monthly Cost:) Tj
190 0 Td
(${formatCurrency(humanCostMonthly)}/month) Tj
-190 -25 Td
(AI Solution Monthly Cost:) Tj
190 0 Td
(${formatCurrency(totalMonthlyCost)}/month) Tj
-190 -25 Td
(Monthly Savings:) Tj
190 0 Td
${brandRed} rg
(${formatCurrency(monthlySavings)}/month) Tj
0 0 0 rg
-190 -25 Td
(Annual Savings:) Tj
190 0 Td
${brandRed} rg
(${formatCurrency(yearlySavings)}/year) Tj
0 0 0 rg
-190 -25 Td
(Savings Percentage:) Tj
190 0 Td
${brandRed} rg
(${Math.round(savingsPercentage)}%) Tj
0 0 0 rg
-190 -45 Td

/F2 18 Tf
${brandRed} rg
(Return on Investment) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Based on the projected savings and implementation costs, your expected ROI timeline is:) Tj
0 -30 Td
(\\267 Break-even Point: ${breakEvenPoint} months) Tj
0 -25 Td
(\\267 First Year ROI: ${firstYearROI}%) Tj
0 -25 Td
(\\267 Five-Year Total Savings: ${formatCurrency(fiveYearSavings)}) Tj
0 0 0 rg
ET
Q
endstream
endobj

23 0 obj
<< /Length 3000 >>
stream
q
${brandRed} rg
0 792 612 -70 re f
0 0 0 rg
BT
/F2 24 Tf
72 740 Td
1 1 1 rg
(IMPLEMENTATION PLAN & NEXT STEPS) Tj
0 0 0 rg
0 -45 Td
/F2 18 Tf
${brandRed} rg
(Implementation Process) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
${brandRed} rg
(1. Discovery Workshop) Tj
0 0 0 rg
0 -20 Td
(   \\267 Detailed assessment of your current processes and requirements) Tj
0 -20 Td
(   \\267 Identification of key integration points and customization needs) Tj
0 -20 Td
(   \\267 Development of implementation roadmap and timeline) Tj
0 -30 Td
${brandRed} rg
(2. Development and Customization) Tj
0 0 0 rg
0 -20 Td
(   \\267 AI model training with your business-specific data) Tj
0 -20 Td
(   \\267 User interface customization aligned with your brand) Tj
0 -20 Td
(   \\267 Integration with your existing systems and workflows) Tj
0 -30 Td
${brandRed} rg
(3. Testing and Deployment) Tj
0 0 0 rg
0 -20 Td
(   \\267 Comprehensive testing and quality assurance) Tj
0 -20 Td
(   \\267 Phased deployment to minimize business disruption) Tj
0 -20 Td
(   \\267 Performance monitoring and fine-tuning) Tj
0 -30 Td
${brandRed} rg
(4. Training and Adoption) Tj
0 0 0 rg
0 -20 Td
(   \\267 User training and knowledge transfer) Tj
0 -20 Td
(   \\267 Development of adoption strategy) Tj
0 -20 Td
(   \\267 Ongoing support and performance optimization) Tj

0 -40 Td
/F2 18 Tf
${brandRed} rg
(Next Steps) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(To proceed with implementing this AI solution for ${companyName}:) Tj
0 -30 Td
(\\267 Schedule a demonstration of our ${tierName} solution) Tj
0 -20 Td
(\\267 Finalize the proposal details and customization requirements) Tj
0 -20 Td
(\\267 Sign agreement and schedule kickoff meeting) Tj
0 0 0 rg
0 -40 Td
/F2 16 Tf
${brandRed} rg
(For questions or to move forward, please contact us at:) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Email: info@chatsites.ai) Tj
0 -20 Td
(Phone: +1 480-862-0288) Tj
0 -20 Td
(Website: www.chatsites.ai) Tj
ET
Q
endstream
endobj

30 0 obj
<< /Type /ExtGState
   /CA 1.0
   /ca 1.0
>>
endobj

31 0 obj
<< /Type /ExtGState
   /CA 0.5
   /ca 0.5
>>
endobj

32 0 obj
<< /Type /ExtGState
   /CA 0.8
   /ca 0.8
>>
endobj

xref
0 33
0000000000 65535 f
0000000010 00000 n
0000000079 00000 n
0000000158 00000 n
0000000207 00000 n
0000000405 00000 n
0000000491 00000 n
0000000581 00000 n
0000000673 00000 n
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000000871 00000 n
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000001071 00000 n
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000001271 00000 n
0000004625 00000 n
0000008179 00000 n
0000011933 00000 n
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000014987 00000 n
0000015051 00000 n
0000015115 00000 n
trailer
<< /Size 33
   /Root 1 0 R
>>
startxref
15179
%%EOF
  `;
  
  return pdfContent;
}
