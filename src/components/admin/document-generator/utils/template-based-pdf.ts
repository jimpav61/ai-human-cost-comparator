
import { Lead } from "@/types/leads";
import { formatCurrency } from "@/utils/formatters";
import { CalculationResults } from "@/hooks/calculator/types";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";

/**
 * Template-based PDF generator that uses direct value replacement
 * without complex transformations or recalculations
 */
export function generateTemplateBasedPdf(lead: Lead): string {
  console.log("=== GENERATING PROPOSAL WITH TEMPLATE-BASED APPROACH ===");
  console.log("Lead ID:", lead.id);
  console.log("Company name:", lead.company_name);
  
  // Log the entire calculator_results for debugging
  console.log("FULL CALCULATOR RESULTS:", JSON.stringify(lead.calculator_results, null, 2));
  
  // Create default CalculationResults structure
  const defaultResults: CalculationResults = {
    aiCostMonthly: {
      voice: 0,
      chatbot: 229,
      total: 229,
      setupFee: 749
    },
    basePriceMonthly: 229,
    humanCostMonthly: 0,
    monthlySavings: 0,
    yearlySavings: 0,
    savingsPercentage: 0,
    breakEvenPoint: {
      voice: 0,
      chatbot: 0
    },
    humanHours: {
      dailyPerEmployee: 8,
      weeklyTotal: 40,
      monthlyTotal: 160,
      yearlyTotal: 1920
    },
    annualPlan: 2290,
    tierKey: "growth",
    aiType: "both",
    includedVoiceMinutes: 600,
    additionalVoiceMinutes: 0
  };

  // Extract data directly from lead, using ensureCompleteCalculatorResults
  const calculatorResults: CalculationResults = lead.calculator_results 
    ? ensureCompleteCalculatorResults(lead.calculator_results as Partial<CalculationResults>) 
    : defaultResults;
  
  // Company information - use exactly what's in the lead
  const companyName = lead.company_name || 'Client';
  const contactName = lead.name || 'Valued Client';
  const email = lead.email || 'client@example.com';
  const phoneNumber = lead.phone_number || 'Not provided';
  const industry = lead.industry || 'Technology';
  
  // Extract plan/pricing information DIRECTLY without recalculation
  const tierKey = calculatorResults.tierKey || 'growth';
  const aiType = calculatorResults.aiType || 'both';
  
  // CRITICAL: Take financial values EXACTLY as stored, with no modifications
  const basePriceMonthly = calculatorResults.basePriceMonthly || 229;
  const humanCostMonthly = calculatorResults.humanCostMonthly || 0;
  const monthlySavings = calculatorResults.monthlySavings || 0;
  const yearlySavings = calculatorResults.yearlySavings || 0;
  const savingsPercentage = calculatorResults.savingsPercentage || 0;
  
  // Get the aiCostMonthly structure exactly as stored
  const aiCostMonthly = calculatorResults.aiCostMonthly || {
    voice: 0,
    chatbot: 229,
    total: 229,
    setupFee: 749
  };
  
  // Print all values to ensure they're being used correctly
  console.log("TEMPLATE VALUES:", {
    companyName,
    contactName,
    humanCostMonthly,
    basePriceMonthly,
    monthlySavings,
    yearlySavings,
    savingsPercentage,
    tierKey,
    aiType,
    aiCostMonthly
  });
  
  // Simple lookup tables for tier and AI type display names
  const tierName = tierKey === 'starter' ? 'Starter Plan' : 
                  tierKey === 'growth' ? 'Growth Plan' : 
                  tierKey === 'premium' ? 'Premium Plan' : 'Growth Plan';
  
  const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                      aiType === 'voice' ? 'Basic Voice' : 
                      aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                      aiType === 'both' ? 'Text & Basic Voice' : 
                      aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
  
  // Get additional values directly from the calculator data
  const setupFee = aiCostMonthly.setupFee;
  const totalMonthlyCost = aiCostMonthly.total;
  const voiceCost = aiCostMonthly.voice || 0;
  const additionalVoiceMinutes = lead.calculator_inputs?.callVolume || 0;
  // Safely access annualPlan with type checking
  const annualPlan = typeof calculatorResults.annualPlan === 'number' ? calculatorResults.annualPlan : 0;
  
  // Derived values for ROI calculations
  const breakEvenPoint = monthlySavings > 0 ? Math.ceil(setupFee / monthlySavings) : 1;
  const firstYearROI = monthlySavings > 0 ? Math.round((yearlySavings - setupFee) / setupFee * 100) : 0;
  const fiveYearSavings = yearlySavings * 5;
  
  // Format date for proposal
  const today = new Date();
  const formattedDate = `${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}, ${today.getFullYear()}`;
  
  // Brand Colors
  const brandRed = "#ff432a";
  
  // Now let's create the PDF template with placeholders
  // This is our static template - we'll just replace the values directly
  let pdfTemplate = `
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
(\\267 ${tierName} AI Engine with ${tierKey === 'premium' ? 'advanced' : tierKey === 'growth' ? 'enhanced' : 'standard'} capabilities) Tj
0 -20 Td
(\\267 ${aiTypeDisplay} Interface ${tierKey !== 'starter' ? 'with speech recognition and synthesis' : ''}) Tj
0 -20 Td`;

  // Add voice information based on tier and type
  if (tierKey === 'starter') {
    pdfTemplate += `
(\\267 No voice capabilities included in this tier) Tj
0 -20 Td`;
  } else {
    pdfTemplate += `
(\\267 Includes 600 voice minutes per month as part of base plan) Tj
0 -20 Td`;
    
    if (additionalVoiceMinutes > 0) {
      pdfTemplate += `
(\\267 ${additionalVoiceMinutes} additional voice minutes at $0.12/minute) Tj
0 -20 Td
(\\267 Additional voice cost: $${(additionalVoiceMinutes * 0.12).toFixed(2)}/month) Tj
0 -20 Td`;
    } else {
      pdfTemplate += `
(\\267 No additional voice minutes requested) Tj
0 -20 Td`;
    }
  }

  // Continue with standard content
  pdfTemplate += `
(\\267 ${tierKey === 'premium' ? 'Unlimited' : '50,000+'} monthly text interactions) Tj
0 -20 Td
(\\267 Secure cloud-based deployment with 99.9% uptime guarantee) Tj
0 -20 Td
(\\267 ${tierKey === 'premium' ? 'Priority' : 'Standard'} technical support and maintenance) Tj
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
($${basePriceMonthly.toFixed(2)}/month) Tj
-190 -25 Td
(Setup and Onboarding Fee:) Tj
190 0 Td
($${setupFee.toFixed(2)} one-time) Tj
-190 -25 Td`;

  // Handle voice minutes information 
  if (tierKey === 'starter') {
    pdfTemplate += `
(Voice Capabilities:) Tj
190 0 Td
(Not included in Starter Plan) Tj
-190 -25 Td`;
  } else {
    pdfTemplate += `
(Included Voice Minutes:) Tj
190 0 Td
(600 minutes/month) Tj
-190 -25 Td`;
    
    if (additionalVoiceMinutes > 0) {
      pdfTemplate += `
(Additional Voice Minutes:) Tj
190 0 Td
(${additionalVoiceMinutes} minutes @ $0.12/minute) Tj
-190 -25 Td
(Additional Voice Cost:) Tj
190 0 Td
($${(additionalVoiceMinutes * 0.12).toFixed(2)}/month) Tj
-190 -25 Td`;
    } else {
      pdfTemplate += `
(Additional Voice Minutes:) Tj
190 0 Td
(None requested) Tj
-190 -25 Td`;
    }
  }

  // Show total monthly cost with clear breakdown
  pdfTemplate += `
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

  console.log("==== PDF GENERATION COMPLETE ====");
  return pdfTemplate;
}
