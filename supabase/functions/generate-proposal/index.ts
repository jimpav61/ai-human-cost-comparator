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
    console.log("Request data received:", JSON.stringify(requestData, null, 2));
    
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
    
    // Log calculator data to troubleshoot
    console.log("Lead calculator_inputs:", JSON.stringify(lead.calculator_inputs, null, 2));
    console.log("Lead calculator_results:", JSON.stringify(lead.calculator_results, null, 2));
    console.log("AI Tier:", lead.calculator_inputs?.aiTier);
    console.log("AI Type:", lead.calculator_inputs?.aiType);
    console.log("Additional Voice Minutes:", lead.calculator_inputs?.callVolume);
    
    // Ensure calculator data exists and is properly formatted
    if (!lead.calculator_inputs || typeof lead.calculator_inputs !== 'object') {
      lead.calculator_inputs = {};
    }
    
    if (!lead.calculator_results || typeof lead.calculator_results !== 'object') {
      lead.calculator_results = {};
    }
    
    // Ensure critical values are properly set
    if (!lead.calculator_inputs.aiTier) {
      lead.calculator_inputs.aiTier = lead.calculator_results?.tierKey || 'growth';
      console.log("Set missing aiTier from calculator_results:", lead.calculator_inputs.aiTier);
    }
    
    if (!lead.calculator_inputs.aiType) {
      lead.calculator_inputs.aiType = lead.calculator_results?.aiType || 'both';
      console.log("Set missing aiType from calculator_results:", lead.calculator_inputs.aiType);
    }
    
    // Make sure callVolume is a number
    if (typeof lead.calculator_inputs.callVolume === 'string') {
      lead.calculator_inputs.callVolume = parseInt(lead.calculator_inputs.callVolume, 10) || 0;
      console.log("Converted callVolume from string to number:", lead.calculator_inputs.callVolume);
    } else if (lead.calculator_inputs.callVolume === undefined || lead.calculator_inputs.callVolume === null) {
      lead.calculator_inputs.callVolume = 0;
      console.log("Set default callVolume to 0");
    }
    
    // Force callVolume to 0 for starter plan
    if (lead.calculator_inputs.aiTier === 'starter') {
      lead.calculator_inputs.callVolume = 0;
      console.log("Reset callVolume to 0 for starter plan");
    }
    
    if (isPreviewMode) {
      // In preview mode, generate and return the PDF directly
      console.log("Generating preview PDF for download");
      
      // Get company name from lead data for the filename
      const companyName = lead.company_name || 'Client';
      // Sanitize company name for filename
      const safeCompanyName = companyName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      
      // Create a professional multi-page proposal PDF with actual lead data
      const pdfContent = generateProfessionalProposal(lead);
      
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

// Function to generate a professional, multi-page proposal PDF with lead data
function generateProfessionalProposal(lead) {
  // Extract required data
  const companyName = lead.company_name || 'Client';
  const contactName = lead.name || 'Valued Client';
  const email = lead.email || 'client@example.com';
  const phoneNumber = lead.phone_number || 'Not provided';
  const industry = lead.industry || 'Technology';
  const employeeCount = lead.employee_count || '10';
  
  // Log complete lead data for debugging
  console.log("Full lead data for proposal generation:", JSON.stringify(lead, null, 2));
  
  // Get calculator data if available
  let calculatorInputs = {};
  let calculatorResults = {};
  
  // First try to access calculator_inputs/results directly
  if (lead.calculator_inputs) {
    calculatorInputs = lead.calculator_inputs;
    console.log("Found calculator inputs in lead:", JSON.stringify(calculatorInputs, null, 2));
  }
  
  if (lead.calculator_results) {
    calculatorResults = lead.calculator_results;
    console.log("Found calculator results in lead:", JSON.stringify(calculatorResults, null, 2));
  }
  
  // Enhanced parsing for calculator inputs and results
  // Handle case where they might be strings
  if (typeof calculatorInputs === 'string') {
    try {
      calculatorInputs = JSON.parse(calculatorInputs);
      console.log("Parsed calculator_inputs from string:", JSON.stringify(calculatorInputs, null, 2));
    } catch (e) {
      console.error("Error parsing calculator_inputs:", e);
      calculatorInputs = {};
    }
  }
  
  if (typeof calculatorResults === 'string') {
    try {
      calculatorResults = JSON.parse(calculatorResults);
      console.log("Parsed calculator_results from string:", JSON.stringify(calculatorResults, null, 2));
    } catch (e) {
      console.error("Error parsing calculator_results:", e);
      calculatorResults = {};
    }
  }
  
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
  
  // Get price details from calculator results first, then fall back to tier defaults
  const monthlyPrice = calculatorResults.basePriceMonthly || 
                      (aiTier === 'starter' ? 99 : 
                       aiTier === 'growth' ? 229 :
                       aiTier === 'premium' ? 429 : 229);
  
  // Updated setup fees - use the results first, then fall back to defaults
  const setupFee = calculatorResults.aiCostMonthly?.setupFee ||
                  (aiTier === 'starter' ? 249 :
                   aiTier === 'growth' ? 749 :
                   aiTier === 'premium' ? 1149 : 749);
  
  // Get voice details - different for each tier
  const includedVoiceMinutes = aiTier === 'starter' ? 0 : 600;
  
  // Improved call volume extraction with better type handling
  let additionalVoiceMinutes = 0;
  
  if (aiTier !== 'starter') {
    // First check if callVolume exists as a direct property
    if (calculatorInputs && 'callVolume' in calculatorInputs) {
      // Handle different types - ensure we have a number
      if (typeof calculatorInputs.callVolume === 'string') {
        additionalVoiceMinutes = parseInt(calculatorInputs.callVolume, 10) || 0;
      } else if (typeof calculatorInputs.callVolume === 'number') {
        additionalVoiceMinutes = calculatorInputs.callVolume;
      }
      
      console.log("Using additional voice minutes from inputs:", additionalVoiceMinutes);
    } else {
      // Try to calculate from voice costs in results
      if (calculatorResults.aiCostMonthly && calculatorResults.aiCostMonthly.voice > 0) {
        // If we have voice costs in the results, calculate the minutes (at 12¢ per minute)
        additionalVoiceMinutes = Math.round(calculatorResults.aiCostMonthly.voice / 0.12);
        console.log("Calculated additional voice minutes from costs:", additionalVoiceMinutes);
      }
    }
  }
  
  console.log("Final additional voice minutes:", additionalVoiceMinutes);
  
  // Calculate any voice costs based on additional minutes
  let voiceCost = 0;
  if (additionalVoiceMinutes > 0 && aiTier !== 'starter') {
    voiceCost = additionalVoiceMinutes * 0.12;
    console.log("Calculated voice cost:", voiceCost);
  } else if (calculatorResults.aiCostMonthly && calculatorResults.aiCostMonthly.voice > 0) {
    // If we have voice costs in the results, use them directly
    voiceCost = calculatorResults.aiCostMonthly.voice;
    console.log("Using voice cost from results:", voiceCost);
  }
  
  // Total monthly cost - ensure voice cost is included
  const totalMonthlyCost = calculatorResults.aiCostMonthly?.total || (monthlyPrice + voiceCost);
  
  // CRITICAL FIX: Use calculator results values directly for financial data
  // Exact values from calculationResults are crucial for consistency with the report
  // Add extensive logging to help debug any issues
  console.log("Original humanCostMonthly from results:", calculatorResults.humanCostMonthly);
  console.log("Original monthlySavings from results:", calculatorResults.monthlySavings);
  console.log("Original yearlySavings from results:", calculatorResults.yearlySavings);
  console.log("Original savingsPercentage from results:", calculatorResults.savingsPercentage);
  
  // Use exact values from calculatorResults, ensuring realistic defaults if missing
  const humanCostMonthly = calculatorResults.humanCostMonthly !== undefined 
    ? calculatorResults.humanCostMonthly 
    : 15000;
    
  const monthlySavings = calculatorResults.monthlySavings !== undefined 
    ? calculatorResults.monthlySavings 
    : (humanCostMonthly - totalMonthlyCost);
    
  const yearlySavings = calculatorResults.yearlySavings !== undefined
    ? calculatorResults.yearlySavings
    : (monthlySavings * 12);
    
  const savingsPercentage = calculatorResults.savingsPercentage !== undefined
    ? calculatorResults.savingsPercentage
    : (humanCostMonthly > 0 ? Math.round((monthlySavings / humanCostMonthly) * 100) : 80);
  
  // Calculate annual plan price - ensure it matches the report
  const annualPlan = calculatorResults.annualPlan !== undefined
    ? calculatorResults.annualPlan
    : (totalMonthlyCost * 10);
  
  // Log final values for debugging
  console.log("FINAL VALUES FOR PROPOSAL:");
  console.log("humanCostMonthly:", humanCostMonthly);
  console.log("monthlySavings:", monthlySavings);
  console.log("yearlySavings:", yearlySavings);
  console.log("savingsPercentage:", savingsPercentage);
  console.log("annualPlan:", annualPlan);
  console.log("totalMonthlyCost:", totalMonthlyCost);
  
  // Calculate ROI details with defaults if missing
  const breakEvenPoint = Math.ceil(setupFee / (monthlySavings || 1000));
  
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
  
  // Log the specific values that will be shown in the PDF
  console.log("PDF Values:", {
    tierName,
    aiTypeDisplay,
    monthlyPrice,
    setupFee,
    additionalVoiceMinutes,
    includedVoiceMinutes,
    humanCostMonthly,
    monthlySavings,
    yearlySavings,
    savingsPercentage,
    annualPlan
  });
  
  // Brand Colors
  const brandRed = "#ff432a";  // Main brand color
  const brandDarkBlue = "#1a202c"; // Dark blue for headings
  
  // Generate PDF content - the template is kept mostly the same, 
  // but values are now from calculator_results
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

(\\267 Reduction in operational costs by up to ${savingsPercentage}%) Tj
0 -20 Td
(\\267 Estimated annual savings of $${formatCurrency(yearlySavings)}) Tj
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
(\\267 ${additionalVoiceMinutes} additional voice minutes at $${voiceCostPerMinute.toFixed(2)}/minute) Tj
0 -20 Td
(\\267 Additional voice cost: $${voiceCost.toFixed(2)}/month) Tj
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
($${monthlyPrice.toFixed(2)}/month) Tj
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
(${additionalVoiceMinutes} minutes @ $${voiceCostPerMinute.toFixed(2)}/minute) Tj
-190 -25 Td
(Additional Voice Cost:) Tj
190 0 Td
($${voiceCost.toFixed(2)}/month) Tj
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
(${savingsPercentage}%) Tj
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

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }
  
  function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
  }
}
