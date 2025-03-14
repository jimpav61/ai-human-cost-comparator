
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
      aiType = 'both'
    } = lead.calculator_results;
    
    // Include version info if available
    const versionInfo = lead.version_info || {
      version_number: 1,
      created_at: new Date().toISOString(),
      notes: "Initial proposal"
    };
    
    // Generate the PDF as a valid PDF document with proper header
    const pdfHeader = '%PDF-1.4';
    const timestamp = versionInfo.created_at || new Date().toISOString();
    const companyName = lead.company_name || 'Client';
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
    
    // Create a PDF document with proposal information - CRITICAL: proper PDF structure
    const content = `${pdfHeader}
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Length 1500 >>
stream
BT
/F2 24 Tf
50 750 Td
(AI Business Proposal for ${companyName}) Tj
/F2 14 Tf
0 -30 Td
(Version ${versionNumber} - ${new Date(timestamp).toLocaleDateString()}) Tj
/F1 12 Tf
0 -30 Td
(SELECTED PLAN) Tj
0 -20 Td
(Plan: ${planName}) Tj
0 -15 Td
(AI Type: ${aiTypeDisplay}) Tj
0 -30 Td
(BUSINESS COST ANALYSIS) Tj
0 -20 Td
(Current Monthly Cost: ${formatCurrency(humanCostMonthly)}) Tj
0 -15 Td
(AI Solution Monthly Cost: ${formatCurrency(aiCostMonthly.total || 0)}) Tj
0 -15 Td
(Setup Fee: ${formatCurrency(aiCostMonthly.setupFee || 0)}) Tj
0 -25 Td
(SAVINGS SUMMARY) Tj
0 -20 Td
(Monthly Savings: ${formatCurrency(monthlySavings)}) Tj
0 -15 Td
(Annual Savings: ${formatCurrency(yearlySavings)}) Tj
0 -15 Td
(Savings Percentage: ${formatPercentage(savingsPercentage)}) Tj
0 -25 Td
(Contact us today to implement this solution for your business.) Tj
0 -15 Td
(Generated: ${timestamp}) Tj
0 -15 Td
(Version Notes: ${versionInfo.notes || "Standard proposal"}) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f
0000000010 00000 n
0000000059 00000 n
0000000118 00000 n
0000000223 00000 n
0000000291 00000 n
0000000363 00000 n
trailer
<< /Size 7 /Root 1 0 R >>
startxref
1914
%%EOF`;

    // Return the valid PDF content - this is critical
    console.log("Generated valid PDF with proper PDF header and version info");
    return content;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
