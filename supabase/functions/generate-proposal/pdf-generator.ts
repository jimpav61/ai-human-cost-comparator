
// Import utility functions from enhanced shared module
import { formatCurrency, formatNumber, getSafeFileName, formatPercentage } from "../_shared/utils.ts";

/**
 * Generates a professional PDF proposal document based on lead data
 * @param lead The lead data containing company info and calculator results
 * @returns A PDF document as a string with proper PDF structure
 */
export function generateProfessionalProposal(lead: any): string {
  console.log('Generating professional PDF proposal for lead:', lead.id);
  
  try {
    // Validate required lead data
    if (!lead || !lead.company_name) {
      throw new Error('Missing required lead data: company_name');
    }
    
    if (!lead.calculator_results || typeof lead.calculator_results !== 'object') {
      throw new Error('Missing or invalid calculator_results');
    }
    
    // Extract key values from calculator results for easy access
    // Use safe defaults to prevent errors
    const {
      humanCostMonthly = 3800,
      aiCostMonthly = { total: 299, setupFee: 500, voice: 0, chatbot: 299 },
      monthlySavings = 3501,
      yearlySavings = 42012,
      savingsPercentage = 92,
      tierKey = 'growth',
      aiType = 'both',
      additionalVoiceMinutes = 0
    } = lead.calculator_results;
    
    // Include version info if available
    const versionInfo = lead.version_info || {
      version_number: 1,
      created_at: new Date().toISOString(),
      notes: "Initial proposal"
    };
    
    // Extract company information
    const timestamp = versionInfo.created_at || new Date().toISOString();
    const companyName = lead.company_name || 'Client';
    const contactName = lead.name || 'Valued Client';
    const email = lead.email || 'client@example.com';
    const phoneNumber = lead.phone_number || 'Not provided';
    const industry = lead.industry || 'Technology';
    const versionNumber = versionInfo.version_number || 1;
    
    // Determine plan name based on tierKey
    const planName = tierKey === 'starter' ? 'Starter Plan' : 
                    tierKey === 'growth' ? 'Growth Plan' : 
                    tierKey === 'premium' ? 'Premium Plan' : 'Custom Plan';
    
    // Determine AI type display name
    const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                         aiType === 'voice' ? 'Basic Voice' : 
                         aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                         aiType === 'both' ? 'Text & Basic Voice' : 
                         aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Custom';
    
    // Get included voice minutes based on tier
    const includedVoiceMinutes = tierKey === 'starter' ? 0 : 600;
    
    // Calculate voice costs
    const voiceCost = additionalVoiceMinutes * 0.12;
    
    // Determine the base price based on tier
    const basePrice = tierKey === 'starter' ? 99 :
                     tierKey === 'growth' ? 229 :
                     tierKey === 'premium' ? 429 : 229;
                     
    // Format date for the proposal
    const today = new Date();
    const formattedDate = `${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}, ${today.getFullYear()}`;
    
    // Brand color (ChatSite's orange-red)
    const brandRed = "#f65228";
    
    // Create a multi-page PDF document with professional formatting
    const content = `%PDF-1.7
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
(Selected Plan: ${planName} - ${aiTypeDisplay}) Tj
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
(${planName} - ${aiTypeDisplay}) Tj
0 0 0 rg
0 -30 Td
/F1 12 Tf
(Based on your specific business requirements, we recommend our ${planName} with) Tj
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
(\\267 ${planName} AI Engine with ${tierKey === 'premium' ? 'advanced' : tierKey === 'growth' ? 'enhanced' : 'standard'} capabilities) Tj
0 -20 Td
(\\267 ${aiTypeDisplay} Interface ${tierKey !== 'starter' ? 'with speech recognition and synthesis' : ''}) Tj
0 -20 Td`;

    // Add voice information based on tier and type
    if (tierKey === 'starter') {
      content += `
(\\267 No voice capabilities included in this tier) Tj
0 -20 Td`;
    } else {
      content += `
(\\267 Includes ${includedVoiceMinutes} voice minutes per month as part of base plan) Tj
0 -20 Td`;
      
      if (additionalVoiceMinutes > 0) {
        content += `
(\\267 ${additionalVoiceMinutes} additional voice minutes at $0.12/minute) Tj
0 -20 Td
(\\267 Additional voice cost: $${(additionalVoiceMinutes * 0.12).toFixed(2)}/month) Tj
0 -20 Td`;
      } else {
        content += `
(\\267 No additional voice minutes requested) Tj
0 -20 Td`;
      }
    }

    // Continue with standard content
    content += `
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
($${basePrice.toFixed(2)}/month) Tj
-190 -25 Td
(Setup and Onboarding Fee:) Tj
190 0 Td
($${aiCostMonthly.setupFee.toFixed(2)} one-time) Tj
-190 -25 Td`;

    // Handle voice minutes information 
    if (tierKey === 'starter') {
      content += `
(Voice Capabilities:) Tj
190 0 Td
(Not included in Starter Plan) Tj
-190 -25 Td`;
    } else {
      content += `
(Included Voice Minutes:) Tj
190 0 Td
(${includedVoiceMinutes} minutes/month) Tj
-190 -25 Td`;
      
      if (additionalVoiceMinutes > 0) {
        content += `
(Additional Voice Minutes:) Tj
190 0 Td
(${additionalVoiceMinutes} minutes @ $0.12/minute) Tj
-190 -25 Td
(Additional Voice Cost:) Tj
190 0 Td
($${voiceCost.toFixed(2)}/month) Tj
-190 -25 Td`;
      } else {
        content += `
(Additional Voice Minutes:) Tj
190 0 Td
(None requested) Tj
-190 -25 Td`;
      }
    }

    // Show total monthly cost with clear breakdown
    const totalMonthlyCost = basePrice + voiceCost;
    const annualPlan = totalMonthlyCost * 10; // 2 months free
    
    content += `
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
0 -30 Td`;

    // Calculate ROI metrics
    const breakEvenPoint = Math.ceil(aiCostMonthly.setupFee / monthlySavings) || 1;
    const firstYearROI = Math.round((yearlySavings - aiCostMonthly.setupFee) / aiCostMonthly.setupFee * 100) || 0;
    const fiveYearSavings = yearlySavings * 5;

    content += `
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
(\\267 Schedule a demonstration of our ${planName} solution) Tj
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

    // Log success and return the PDF content
    console.log("Generated professional PDF proposal with proper branding and detailed content");
    return content;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
