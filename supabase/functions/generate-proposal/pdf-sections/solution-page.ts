
import { ProposalData } from "../pdf-data-extractor.ts";
import { escapePdfText } from "../pdf-utils.ts";

/**
 * Generate the solution page content for the proposal PDF
 */
export function generateSolutionPageContent(data: ProposalData): string {
  const {
    brandRed,
    companyName,
    tierName,
    tierKey,
    aiTypeDisplay,
    additionalVoiceMinutes,
    includedVoiceMinutes
  } = data;

  // Escape text to prevent PDF syntax errors
  const safeCompanyName = escapePdfText(companyName);
  
  // Create base content
  let content = `q
${brandRed} rg
0 792 612 -70 re f
0 0 0 rg
BT
/F2 24 Tf
60 740 Td
1 1 1 rg
(RECOMMENDED SOLUTION) Tj
0 0 0 rg
0 -45 Td
/F2 18 Tf
${brandRed} rg
(${tierName} - ${tierKey === 'premium' ? 'Text & Conversational Voice' : aiTypeDisplay}) Tj
0 0 0 rg
0 -30 Td
/F1 12 Tf
(Based on your specific business requirements, we recommend our ${tierName} with) Tj
0 -20 Td
(${tierKey === 'premium' ? 'Text & Conversational Voice' : aiTypeDisplay} capabilities as the optimal solution for ${safeCompanyName}.) Tj
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
0 -20 Td`;

  // Check if tier is starter - adjust features description accordingly
  if (tierKey === 'starter') {
    content += `
(\\267 Text-based interface for customer engagement) Tj
0 -20 Td`;
  } else {
    content += `
(\\267 ${tierKey === 'premium' ? 'Text & Conversational Voice' : aiTypeDisplay} interface for versatile customer engagement) Tj
0 -20 Td`;
  }

  content += `
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
0 -20 Td`;

  // Adjust interface description based on tier
  if (tierKey === 'starter') {
    content += `
(\\267 Text-Only Interface) Tj
0 -20 Td`;
  } else {
    content += `
(\\267 ${tierKey === 'premium' ? 'Text & Conversational Voice' : aiTypeDisplay} Interface with speech recognition and synthesis) Tj
0 -20 Td`;
  }

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

  // Add standard content with tier-specific details
  content += `
(\\267 ${tierKey === 'premium' ? 'Unlimited' : tierKey === 'growth' ? '50,000+' : '25,000+'} monthly text interactions) Tj
0 -20 Td
(\\267 Secure cloud-based deployment with 99.9% uptime guarantee) Tj
0 -20 Td
(\\267 ${tierKey === 'premium' ? 'Priority' : tierKey === 'growth' ? 'Enhanced' : 'Standard'} technical support and maintenance) Tj
0 -30 Td

BT
/F2 16 Tf
60 195 Td
${brandRed} rg
(Implementation Timeline:) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(\\267 Discovery and Planning: 1 day) Tj
0 -20 Td
(\\267 Development and Customization: 2-3 days) Tj
0 -20 Td
(\\267 Testing and Quality Assurance: 1 day) Tj
0 -20 Td
(\\267 Deployment and Integration: 1 day) Tj
0 -20 Td
(\\267 Training and Knowledge Transfer: 1 day) Tj
ET
Q`;

  return content;
}
