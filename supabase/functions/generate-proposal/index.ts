
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
    console.log("Request data received:", JSON.stringify(requestData));
    
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
  
  // Get calculator data if available
  const calculatorInputs = lead.calculator_inputs || {};
  const calculatorResults = lead.calculator_results || {};
  
  // Determine AI plan details
  const aiTier = (calculatorInputs.aiTier || '').toLowerCase();
  const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                  aiTier === 'growth' ? 'Growth Plan' : 
                  aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
  
  const aiType = (calculatorInputs.aiType || '').toLowerCase();
  const aiTypeDisplay = aiType.includes('voice') || aiTier === 'growth' || aiTier === 'premium' ? 'Voice Enabled' : 'Text Only';
  
  const monthlyPrice = aiTier === 'starter' ? 99 : 
                      aiTier === 'growth' ? 229 :
                      aiTier === 'premium' ? 429 : 229;
  
  const setupFee = aiTier === 'starter' ? 499 :
                  aiTier === 'growth' ? 749 :
                  aiTier === 'premium' ? 999 : 749;
  
  // Get other financial metrics
  const humanCostMonthly = calculatorResults.humanCostMonthly || 15000;
  const monthlySavings = calculatorResults.monthlySavings || (humanCostMonthly - monthlyPrice);
  const yearlySavings = calculatorResults.yearlySavings || (monthlySavings * 12);
  const savingsPercentage = calculatorResults.savingsPercentage || Math.round((monthlySavings / humanCostMonthly) * 100);
  
  // Get voice details if applicable
  const includedVoiceMinutes = aiTier === 'starter' ? 0 : 
                              aiTier === 'growth' ? 600 : 
                              aiTier === 'premium' ? 1200 : 600;
  
  const additionalVoiceMinutes = Number(calculatorInputs.callVolume) || 0;
  const extraVoiceMinutes = additionalVoiceMinutes > includedVoiceMinutes ? 
                          (additionalVoiceMinutes - includedVoiceMinutes) : 0;
  const voiceCost = extraVoiceMinutes * 0.12;
  
  // Total monthly cost with any additional voice minutes
  const totalMonthlyCost = monthlyPrice + voiceCost;
  
  // Calculate ROI details
  const breakEvenPoint = Math.ceil(setupFee / monthlySavings);
  const firstYearROI = Math.round((yearlySavings - setupFee) / (totalMonthlyCost * 12 + setupFee) * 100);
  const fiveYearSavings = yearlySavings * 5 - (totalMonthlyCost * 12 * 5 + setupFee);
  
  // Brand Colors (using updated brand colors)
  const brandOrange = "0.965 0.322 0.157"; // RGB: 246, 82, 40 (#f65228)
  const brandBlue = "0.13 0.59 0.95"; // Light blue for secondary color
  const brandLightBlue = "0.53 0.81 0.98"; // Softer blue for backgrounds
  const brandLightGreen = "0.76 0.9 0.78"; // Light green for alternate sections
  
  // Create an advanced multi-page PDF with proper sections and branding
  const pdfContent = `
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
${brandOrange} rg
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
${brandOrange} rg
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
0 -30 Td
(Based on our analysis of your requirements in the ${industry} industry with approximately ${employeeCount}) Tj
0 -20 Td
(employees, we have developed a custom AI solution proposal that addresses your specific needs while) Tj
0 -20 Td
(providing significant cost savings and operational benefits.) Tj
0 -40 Td
/F2 16 Tf
${brandOrange} rg
(KEY BENEFITS) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
0.2 0.6 0.3 rg
(• Reduction in operational costs by up to ${savingsPercentage}%) Tj
0 -20 Td
(• Estimated annual savings of $${formatNumber(yearlySavings)}) Tj
0 -20 Td
(• 24/7 customer service availability without additional staffing costs) Tj
0 -20 Td
(• Improved response times and consistency in customer communications) Tj
0 -20 Td
(• Scalable solution that grows with your business needs) Tj
0 0 0 rg
0 -40 Td
/F2 16 Tf
${brandOrange} rg
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

q
${brandLightBlue} rg
72 125 468 -50 re f
Q

BT
/F2 14 Tf
82 110 Td
${brandOrange} rg
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
${brandOrange} rg
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
${brandOrange} rg
(${tierName} - ${aiTypeDisplay}) Tj
0 0 0 rg
0 -30 Td
/F1 12 Tf
(Based on your specific business requirements, we recommend our ${tierName} with) Tj
0 -20 Td
(${aiTypeDisplay} capabilities as the optimal solution for ${companyName}.) Tj
0 -40 Td
/F2 16 Tf
${brandOrange} rg
(Solution Features:) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
0.2 0.6 0.3 rg
(• Customized AI model trained on your business knowledge and processes) Tj
0 -20 Td
(• Advanced natural language processing for accurate understanding of customer inquiries) Tj
0 -20 Td
(• ${aiTypeDisplay} interface for versatile customer engagement) Tj
0 -20 Td
(• Integration capabilities with your existing systems and workflows) Tj
0 -20 Td
(• Comprehensive analytics dashboard for performance monitoring) Tj
0 -20 Td
(• Regular updates and continuous improvement of AI capabilities) Tj
0 0 0 rg
0 -40 Td
/F2 16 Tf
${brandOrange} rg
(Technical Specifications:) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(• ${tierName} AI Engine with ${aiTier === 'premium' ? 'advanced' : aiTier === 'growth' ? 'enhanced' : 'standard'} capabilities) Tj
0 -20 Td
(• ${aiTypeDisplay} Interface ${aiType.includes('voice') ? 'with speech recognition and synthesis' : ''}) Tj
0 -20 Td
${aiTier !== 'starter' ? `(• Includes ${includedVoiceMinutes} voice minutes per month)` : `(• Text-only capabilities)`} Tj
0 -20 Td
${additionalVoiceMinutes > 0 ? `(• Additional voice minutes needed: ${additionalVoiceMinutes} minutes)` : ``} Tj
0 -20 Td
${extraVoiceMinutes > 0 ? `(• Extra minutes beyond plan: ${extraVoiceMinutes} minutes at $0.12/minute = $${(extraVoiceMinutes * 0.12).toFixed(2)}/month)` : ``} Tj
0 -20 Td
(• ${aiTier === 'premium' ? 'Unlimited' : '50,000+'} monthly text interactions) Tj
0 -20 Td
(• Secure cloud-based deployment with 99.9% uptime guarantee) Tj
0 -20 Td
(• ${aiTier === 'premium' ? 'Priority' : 'Standard'} technical support and maintenance) Tj
0 -40 Td

q
${brandLightGreen} rg
72 200 468 -150 re f
Q

BT
/F2 16 Tf
82 185 Td
${brandOrange} rg
(Implementation Timeline:) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(• Discovery and Planning: 1 week) Tj
0 -20 Td
(• Development and Customization: 2-3 weeks) Tj
0 -20 Td
(• Testing and Quality Assurance: 1 week) Tj
0 -20 Td
(• Deployment and Integration: 1 week) Tj
0 -20 Td
(• Training and Knowledge Transfer: 1 week) Tj
ET
Q
endstream
endobj

22 0 obj
<< /Length 3500 >>
stream
q
${brandOrange} rg
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
${brandOrange} rg
(Investment Details) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Monthly Investment:) Tj
200 0 Td
(${formatCurrency(monthlyPrice)}/month) Tj
-200 -25 Td
(Setup and Onboarding Fee:) Tj
200 0 Td
(${formatCurrency(setupFee)} one-time) Tj
-200 -25 Td

${includedVoiceMinutes > 0 ? `(Included Voice Minutes:)` : ``} Tj
${includedVoiceMinutes > 0 ? `200 0 Td` : ``} Tj
${includedVoiceMinutes > 0 ? `(${formatNumber(includedVoiceMinutes)} minutes/month)` : ``} Tj
${includedVoiceMinutes > 0 ? `-200 -25 Td` : ``} Tj

${additionalVoiceMinutes > 0 ? `(Additional Voice Minutes Needed:)` : ``} Tj
${additionalVoiceMinutes > 0 ? `200 0 Td` : ``} Tj
${additionalVoiceMinutes > 0 ? `(${formatNumber(additionalVoiceMinutes)} minutes)` : ``} Tj
${additionalVoiceMinutes > 0 ? `-200 -25 Td` : ``} Tj

${extraVoiceMinutes > 0 ? `(Extra Voice Minutes Cost:)` : ``} Tj
${extraVoiceMinutes > 0 ? `200 0 Td` : ``} Tj
${extraVoiceMinutes > 0 ? `(${formatNumber(extraVoiceMinutes)} minutes @ $0.12 = ${formatCurrency(voiceCost)}/month)` : ``} Tj
${extraVoiceMinutes > 0 ? `-200 -25 Td` : ``} Tj

(Total Monthly Investment:) Tj
200 0 Td
(${formatCurrency(totalMonthlyCost)}/month) Tj
-200 -25 Td
(Annual Investment:) Tj
200 0 Td
(${formatCurrency(totalMonthlyCost * 10)}/year (2 months free with annual plan)) Tj

q
${brandLightBlue} rg
72 500 468 -120 re f
Q

BT
-200 -45 Td
/F2 18 Tf
${brandOrange} rg
(Cost Comparison and Savings) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Current Estimated Monthly Cost:) Tj
200 0 Td
(${formatCurrency(humanCostMonthly)}/month) Tj
-200 -25 Td
(AI Solution Monthly Cost:) Tj
200 0 Td
(${formatCurrency(totalMonthlyCost)}/month) Tj
-200 -25 Td
(Monthly Savings:) Tj
200 0 Td
0.2 0.6 0.3 rg
(${formatCurrency(monthlySavings)}/month) Tj
0 0 0 rg
-200 -25 Td
(Annual Savings:) Tj
200 0 Td
0.2 0.6 0.3 rg
(${formatCurrency(yearlySavings)}/year) Tj
0 0 0 rg
-200 -25 Td
(Savings Percentage:) Tj
200 0 Td
0.2 0.6 0.3 rg
(${savingsPercentage}%) Tj
0 0 0 rg
-200 -45 Td

q
${brandLightGreen} rg
72 300 468 -180 re f
Q

BT
/F2 18 Tf
${brandOrange} rg
(Return on Investment) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Based on the projected savings and implementation costs, your expected ROI timeline is:) Tj
0 -30 Td
0.2 0.6 0.3 rg
(• Break-even Point: ${breakEvenPoint} months) Tj
0 -25 Td
(• First Year ROI: ${firstYearROI}%) Tj
0 -25 Td
(• Five-Year Total Savings: ${formatCurrency(fiveYearSavings)}) Tj
0 0 0 rg
ET
Q
endstream
endobj

23 0 obj
<< /Length 3000 >>
stream
q
${brandOrange} rg
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
${brandOrange} rg
(Implementation Process) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
0.2 0.6 0.3 rg
(1. Discovery Workshop) Tj
0 0 0 rg
0 -20 Td
(   • Detailed assessment of your current processes and requirements) Tj
0 -20 Td
(   • Identification of key integration points and customization needs) Tj
0 -20 Td
(   • Development of implementation roadmap and timeline) Tj
0 -30 Td
0.2 0.6 0.3 rg
(2. Development and Customization) Tj
0 0 0 rg
0 -20 Td
(   • AI model training with your business-specific data) Tj
0 -20 Td
(   • User interface customization aligned with your brand) Tj
0 -20 Td
(   • Integration with your existing systems and workflows) Tj
0 -30 Td
0.2 0.6 0.3 rg
(3. Testing and Deployment) Tj
0 0 0 rg
0 -20 Td
(   • Comprehensive testing and quality assurance) Tj
0 -20 Td
(   • Phased deployment to minimize business disruption) Tj
0 -20 Td
(   • Performance monitoring and fine-tuning) Tj
0 -30 Td
0.2 0.6 0.3 rg
(4. Training and Adoption) Tj
0 0 0 rg
0 -20 Td
(   • User training and knowledge transfer) Tj
0 -20 Td
(   • Development of adoption strategy) Tj
0 -20 Td
(   • Ongoing support and performance optimization) Tj

q
${brandLightBlue} rg
72 260 468 -150 re f
Q

BT
0 -40 Td
/F2 18 Tf
${brandOrange} rg
(Next Steps) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(To proceed with implementing this AI solution for ${companyName}:) Tj
0 -30 Td
0.2 0.6 0.3 rg
(1. Schedule a demonstration of our ${tierName} solution) Tj
0 -20 Td
(2. Finalize the proposal details and customization requirements) Tj
0 -20 Td
(3. Sign agreement and schedule kickoff meeting) Tj
0 0 0 rg
0 -40 Td
/F2 16 Tf
${brandOrange} rg
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
0000011733 00000 n
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000014787 00000 n
0000014851 00000 n
0000014915 00000 n
trailer
<< /Size 33
   /Root 1 0 R
>>
startxref
14979
%%EOF
  `;
  
  // Helper function to format currency
  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }
  
  // Helper function to format numbers with commas
  function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
  }
  
  return pdfContent;
}
