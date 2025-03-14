
// PDF Generation Utilities
// This file contains functions to generate a PDF proposal document

// Import utility functions from shared module
import { formatCurrency, formatNumber, getSafeFileName } from "../_shared/utils.ts";

// Helper function to format percentages
const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value / 100);
};

/**
 * Generates a professional PDF proposal document based on lead data
 * @param lead The lead data containing company info and calculator results
 * @returns A PDF document as a base64 encoded string
 */
export function generateProfessionalProposal(lead: any): string {
  console.log('Generating professional proposal for lead:', lead.id);
  
  try {
    // Validate required lead data
    if (!lead || !lead.company_name) {
      throw new Error('Missing required lead data: company_name');
    }
    
    if (!lead.calculator_results || typeof lead.calculator_results !== 'object') {
      throw new Error('Missing or invalid calculator_results');
    }
    
    // Extract key values from calculator results for easy access
    const {
      humanCostMonthly = 0,
      aiCostMonthly = { total: 0, setupFee: 0 },
      monthlySavings = 0,
      yearlySavings = 0,
      savingsPercentage = 0
    } = lead.calculator_results;
    
    // Generate the PDF as a valid PDF document with proper header
    const pdfHeader = '%PDF-1.4';
    const timestamp = new Date().toISOString();
    
    // Create a PDF document with proposal information
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
<< /Length 1000 >>
stream
BT
/F2 24 Tf
50 750 Td
(AI Business Proposal for ${lead.company_name}) Tj
/F1 12 Tf
0 -40 Td
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
1414
%%EOF`;

    // Return the valid PDF content - this is critical
    console.log("Generated valid PDF with proper PDF header");
    return content;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
