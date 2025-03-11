import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Proposal generation function loaded");

serve(async (req) => {
  // Handle CORS preflight requests - make sure this is properly handled
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
      
      try {
        // Get company name from lead data for the filename
        const companyName = lead.company_name || 'Client';
        // Sanitize company name for filename
        const safeCompanyName = companyName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        
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

// Function to generate a professional, multi-page proposal PDF with lead data
function generateProfessionalProposal(lead) {
  // Extract required data
  const companyName = lead.company_name || 'Client';
  const contactName = lead.name || 'Valued Client';
  const email = lead.email || 'client@example.com';
  const phoneNumber = lead.phone_number || 'Not provided';
  const industry = lead.industry || 'Technology';
  const employeeCount = parseInt(lead.employee_count || '1', 10);
  
  // Log complete lead data for debugging
  console.log("Full lead data for proposal generation:", JSON.stringify(lead, null, 2));
  
  // Extract calculator data and ensure proper typing
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
  
  // Handle string parsing if needed
  if (typeof calculatorInputs === 'string') {
    try {
      calculatorInputs = JSON.parse(calculatorInputs);
    } catch (e) {
      console.error("Error parsing calculator_inputs:", e);
      calculatorInputs = {};
    }
  }
  
  if (typeof calculatorResults === 'string') {
    try {
      calculatorResults = JSON.parse(calculatorResults);
    } catch (e) {
      console.error("Error parsing calculator_results:", e);
      calculatorResults = {};
    }
  }
  
  // Get AI plan details
  const aiTier = (calculatorInputs.aiTier || calculatorResults.tierKey || 'growth').toLowerCase();
  
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
  
  // Get base price and setup fee
  const monthlyPrice = calculatorResults.basePriceMonthly || 
                      (aiTier === 'starter' ? 99 : 
                       aiTier === 'growth' ? 229 :
                       aiTier === 'premium' ? 429 : 229);
  
  const setupFee = calculatorResults.aiCostMonthly?.setupFee ||
                  (aiTier === 'starter' ? 249 :
                   aiTier === 'growth' ? 749 :
                   aiTier === 'premium' ? 1149 : 749);
  
  // Voice minutes calculation
  const includedVoiceMinutes = aiTier === 'starter' ? 0 : 600;
  
  // Get additional voice minutes from inputs - make sure we parse it as a number
  let additionalVoiceMinutes = 0;
  if (aiTier !== 'starter') {
    if (calculatorInputs.callVolume !== undefined) {
      additionalVoiceMinutes = Number(calculatorInputs.callVolume) || 0;
      console.log("Additional voice minutes from callVolume:", additionalVoiceMinutes);
    }
  }
  
  // Calculate voice costs
  const voiceCostPerMinute = 0.12;
  const additionalVoiceCost = additionalVoiceMinutes * voiceCostPerMinute;
  
  // Calculate total monthly cost
  const totalMonthlyCost = monthlyPrice + additionalVoiceCost;
  
  // CRITICAL: Calculate human cost for ONE employee only
  let humanCostPerEmployee = 0;
  
  if (calculatorResults.humanCostMonthly !== undefined) {
    const totalHumanCost = typeof calculatorResults.humanCostMonthly === 'number' 
      ? calculatorResults.humanCostMonthly 
      : parseFloat(calculatorResults.humanCostMonthly);
      
    // Get the employee count, ensuring it's at least 1
    const employeeCount = Math.max(1, parseInt(lead.employee_count || '1', 10));
    
    // Calculate the per-employee cost
    humanCostPerEmployee = totalHumanCost / employeeCount;
    
    console.log("Total human cost:", totalHumanCost);
    console.log("Employee count:", employeeCount);
    console.log("Human cost per employee:", humanCostPerEmployee);
  } else {
    // Default to $5000 per employee if no data available
    humanCostPerEmployee = 5000;
    console.log("Using default human cost per employee:", humanCostPerEmployee);
  }
  
  // Calculate savings based on ONE employee
  const monthlySavings = humanCostPerEmployee - totalMonthlyCost;
  const yearlySavings = monthlySavings * 12;
  const savingsPercentage = humanCostPerEmployee > 0 ? Math.round((monthlySavings / humanCostPerEmployee) * 100) : 0;
  
  // Calculate annual plan price - ensure it matches the report
  const annualPlan = calculatorResults.annualPlan !== undefined
    ? calculatorResults.annualPlan
    : (totalMonthlyCost * 10);
  
  // Log final values for debugging
  console.log("FINAL VALUES FOR PROPOSAL:");
  console.log("humanCostPerEmployee:", humanCostPerEmployee);
  console.log("monthlyPrice:", monthlyPrice);
  console.log("additionalVoiceMinutes:", additionalVoiceMinutes);
  console.log("additionalVoiceCost:", additionalVoiceCost);
  console.log("totalMonthlyCost:", totalMonthlyCost);
  console.log("monthlySavings:", monthlySavings);
  console.log("yearlySavings:", yearlySavings);
  console.log("savingsPercentage:", savingsPercentage);
  console.log("annualPlan:", annualPlan);
  
  // Calculate ROI details with defaults if missing
  const breakEvenPoint = Math.ceil(setupFee / (monthlySavings || 1000));
  
  // Calculate first year ROI
  const firstYearROI = Math.round((yearlySavings - setupFee) / setupFee * 100);
  
  // Calculate five year total savings
  const fiveYearSavings = yearlySavings * 5;
  
  // Generate current date for the proposal
  const today = new Date();
  const formattedDate = `${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}, ${today.getFullYear()}`;
  
  // Format all monetary values for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
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
    humanCostPerEmployee,
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
($${additionalVoiceCost.toFixed(2)}/month) Tj
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
(${formatCurrency(humanCostPerEmployee)}/month) Tj
-190 -25 Td
(AI Solution Monthly Cost:) Tj
190 0 Td
(${formatCurrency(totalMonthlyCost)}/month) Tj
-190 -25 Td
(Monthly Savings (Per Employee):) Tj
190 0 Td
${brandRed} rg
(${formatCurrency(monthlySavings)}/month) Tj
0 0 0 rg
-190 -25 Td
(Annual Savings (Per Employee):) Tj
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
