
import { ProposalData } from "../pdf-data-extractor.ts";
import { escapePdfText } from "../pdf-utils.ts";

/**
 * Generate the cover page content for the proposal PDF
 */
export function generateCoverPageContent(data: ProposalData): string {
  console.log("Generating cover page with data:", { 
    companyName: data.companyName,
    contactName: data.contactName,
    tierName: data.tierName,
    formattedDate: data.formattedDate
  });
  
  const {
    brandRed,
    companyName,
    contactName,
    email,
    phoneNumber,
    tierName,
    aiTypeDisplay,
    savingsPercentage,
    formattedYearlySavings,
    formattedDate
  } = data;

  // Escape all text values to prevent PDF syntax errors
  const safeCompanyName = escapePdfText(companyName);
  const safeContactName = escapePdfText(contactName);
  const safeEmail = escapePdfText(email);
  const safePhoneNumber = escapePdfText(phoneNumber);
  const savingsPercent = Math.round(savingsPercentage);

  return `q
${brandRed} rg
0 792 612 -70 re f
0 0 0 rg
BT
/F2 28 Tf
60 740 Td
1 1 1 rg
(AI SOLUTION PROPOSAL) Tj
0 0 0 rg
/F1 12 Tf
0 -36 Td
(Prepared exclusively for ${safeCompanyName}) Tj
/F2 18 Tf
0 -50 Td
${brandRed} rg
(EXECUTIVE SUMMARY) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(Dear ${safeContactName},) Tj
0 -20 Td
(Thank you for the opportunity to present our AI solution proposal for ${safeCompanyName}. At ChatSites.ai, we) Tj
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

(\\267 Reduction in operational costs by up to ${savingsPercent}%) Tj
0 -20 Td
(\\267 Estimated annual savings of ${formattedYearlySavings}) Tj
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
(${safeContactName}) Tj
0 -20 Td
(${safeCompanyName}) Tj
0 -20 Td
(${safeEmail}) Tj
0 -20 Td
(${safePhoneNumber}) Tj

BT
/F2 14 Tf
60 90 Td
${brandRed} rg
(Selected Plan: ${tierName} - ${aiTypeDisplay}) Tj
0 0 0 rg
/F1 12 Tf
0 -25 Td
(Date: ${formattedDate}) Tj
ET
Q`;
}
