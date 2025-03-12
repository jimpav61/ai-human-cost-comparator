import { Lead } from "@/types/leads";
import { CalculationResults } from "@/hooks/calculator/types";

/**
 * Generates a professional, multi-page proposal PDF with lead data
 * Using exact values from calculator_results without modification
 */
export const generateProposalPdf = (lead: Lead) => {
  // Extract lead information
  const companyName = lead.company_name || 'Client';
  const contactName = lead.name || 'Client';
  const email = lead.email || 'client@example.com';
  const phoneNumber = lead.phone_number || 'Not provided';
  const industry = lead.industry || 'Technology';
  
  // CRITICAL: Use exact calculator results without any processing
  const calculatorResults = lead.calculator_results;
  
  // Extract AI tier and type directly from calculator inputs
  const aiTier = lead.calculator_inputs?.aiTier || 'growth';
  const aiType = lead.calculator_inputs?.aiType || 'both';
  
  // Get display names directly from saved values
  const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                  aiTier === 'growth' ? 'Growth Plan' : 'Premium Plan';
  
  const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                       aiType === 'voice' ? 'Basic Voice' : 
                       aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                       aiType === 'both' ? 'Text & Basic Voice' : 
                       aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
  
  // Use exact values from calculator_results - no fallbacks or recalculations
  const basePrice = calculatorResults.basePriceMonthly;
  const totalPrice = calculatorResults.aiCostMonthly.total;
  const setupFee = calculatorResults.aiCostMonthly.setupFee;
  const humanCostMonthly = calculatorResults.humanCostMonthly;
  const monthlySavings = calculatorResults.monthlySavings;
  const yearlySavings = calculatorResults.yearlySavings;
  const savingsPercentage = calculatorResults.savingsPercentage;
  const annualPlan = calculatorResults.annualPlan;
  const voiceCost = calculatorResults.aiCostMonthly.voice;
  const includedMinutes = aiTier === 'starter' ? 0 : 600;
  const callVolume = lead.calculator_inputs?.callVolume || 0;

  // Brand Colors
  const brandRed = "#ff432a";
  
  // Generate PDF content
  return generatePdfContent({
    brandRed,
    companyName,
    contactName,
    email,
    phoneNumber,
    industry,
    aiTier,
    aiType,
    tierName,
    aiTypeDisplay,
    basePrice,
    includedMinutes,
    callVolume,
    voiceCost,
    totalPrice,
    setupFee,
    humanCostMonthly,
    monthlySavings,
    yearlySavings,
    savingsPercentage,
    annualPlan
  });
};

interface PdfContentParams {
  brandRed: string;
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  industry: string;
  aiTier: string;
  aiType: string;
  tierName: string;
  aiTypeDisplay: string;
  basePrice: number;
  includedMinutes: number;
  callVolume: number;
  voiceCost: number;
  totalPrice: number;
  setupFee: number;
  humanCostMonthly: number;
  monthlySavings: number;
  yearlySavings: number;
  savingsPercentage: number;
  annualPlan: boolean;
}

// Function to generate the actual PDF content
function generatePdfContent(params: PdfContentParams): string {
  const {
    brandRed,
    companyName,
    contactName,
    email,
    phoneNumber,
    aiTier,
    aiType,
    tierName,
    aiTypeDisplay,
    basePrice,
    includedMinutes,
    callVolume,
    voiceCost,
    totalPrice,
    setupFee,
    humanCostMonthly,
    monthlySavings,
    yearlySavings,
    savingsPercentage,
    annualPlan
  } = params;

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
(\\267 Estimated annual savings of $${Math.round(yearlySavings).toLocaleString()}) Tj
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
/F1 12 Tf
0 -25 Td
(Date: ${formattedDate}) Tj
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

  // Add voice information based on plan tier
  if (aiTier === 'starter') {
    pdfContent += `
(\\267 No voice capabilities included in this tier) Tj
0 -20 Td`;
  } else {
    pdfContent += `
(\\267 Includes ${includedMinutes} voice minutes per month as part of base plan) Tj
0 -20 Td`;
    
    if (callVolume > 0) {
      pdfContent += `
(\\267 ${callVolume} additional voice minutes at $0.12/minute) Tj
0 -20 Td
(\\267 Additional voice cost: $${voiceCost.toFixed(2)}/month) Tj
0 -20 Td`;
    } else {
      pdfContent += `
(\\267 No additional voice minutes requested) Tj
0 -20 Td`;
    }
  }

  // Continue with plan details
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
($${basePrice.toFixed(2)}/month) Tj
-190 -25 Td
(Setup and Onboarding Fee:) Tj
190 0 Td
($${setupFee.toFixed(2)} one-time) Tj
-190 -25 Td`;

  // Voice information based on tier
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
(${includedMinutes} minutes/month) Tj
-190 -25 Td`;
    
    if (callVolume > 0) {
      pdfContent += `
(Additional Voice Minutes:) Tj
190 0 Td
(${callVolume} minutes @ $0.12/minute) Tj
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

  // Total costs and savings
  pdfContent += `
(Total Monthly Investment:) Tj
190 0 Td
($${totalPrice.toFixed(2)}/month) Tj
-190 -25 Td
(Annual Investment:) Tj
190 0 Td
($${(totalPrice * 10).toFixed(2)}/year (2 months free with annual plan)) Tj
-190 -45 Td

/F2 18 Tf
${brandRed} rg
(Cost Comparison and Savings) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Current Estimated Monthly Cost:) Tj
190 0 Td
($${humanCostMonthly.toLocaleString()}/month) Tj
-190 -25 Td
(AI Solution Monthly Cost:) Tj
190 0 Td
($${totalPrice.toFixed(2)}/month) Tj
-190 -25 Td
(Monthly Savings:) Tj
190 0 Td
${brandRed} rg
($${monthlySavings.toLocaleString()}/month) Tj
0 0 0 rg
-190 -25 Td
(Annual Savings:) Tj
190 0 Td
${brandRed} rg
($${yearlySavings.toLocaleString()}/year) Tj
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
(\\267 Break-even Point: ${Math.ceil(setupFee / monthlySavings)} months) Tj
0 -25 Td
(\\267 First Year ROI: ${Math.round((yearlySavings - setupFee) / setupFee * 100)}%) Tj
0 -25 Td
(\\267 Five-Year Total Savings: $${(yearlySavings * 5).toLocaleString()}) Tj
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
  return pdfContent;
}
