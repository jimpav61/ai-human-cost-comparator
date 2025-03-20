
import { ProposalData } from "../pdf-data-extractor.ts";
import { formatPdfCurrency } from "../pdf-utils.ts";

/**
 * Generate the financial page content for the proposal PDF
 */
export function generateFinancialPageContent(data: ProposalData): string {
  const {
    brandRed,
    tierKey,
    basePrice,
    setupFee,
    additionalVoiceMinutes,
    totalMonthlyCost,
    formattedHumanCost,
    formattedBasePrice,
    formattedSetupFee,
    formattedTotalCost,
    formattedMonthlySavings,
    formattedYearlySavings,
    formattedSavingsPercentage,
    breakEvenMonths,
    firstYearROI,
    fiveYearSavings
  } = data;

  let content = `q
${brandRed} rg
0 792 612 -70 re f
0 0 0 rg
BT
/F2 24 Tf
60 740 Td
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
160 0 Td
(${formattedBasePrice}/month) Tj
-160 -25 Td
(Setup and Onboarding Fee:) Tj
160 0 Td
(${formattedSetupFee} one-time) Tj
-160 -25 Td`;

  // Handle voice minutes information 
  if (tierKey === 'starter') {
    content += `
(Voice Capabilities:) Tj
160 0 Td
(Not included in Starter Plan) Tj
-160 -25 Td`;
  } else {
    content += `
(Included Voice Minutes:) Tj
160 0 Td
(600 minutes/month) Tj
-160 -25 Td`;
    
    if (additionalVoiceMinutes > 0) {
      content += `
(Additional Voice Minutes:) Tj
160 0 Td
(${additionalVoiceMinutes} minutes @ $0.12/minute) Tj
-160 -25 Td
(Additional Voice Cost:) Tj
160 0 Td
($${(additionalVoiceMinutes * 0.12).toFixed(2)}/month) Tj
-160 -25 Td`;
    } else {
      content += `
(Additional Voice Minutes:) Tj
160 0 Td
(None requested) Tj
-160 -25 Td`;
    }
  }

  // Show total monthly cost with clear breakdown
  content += `
(Total Monthly Investment:) Tj
160 0 Td
(${formattedTotalCost}/month) Tj
-160 -25 Td
(Annual Investment:) Tj
160 0 Td
(${formatPdfCurrency(totalMonthlyCost * 12)}/year) Tj
-160 -45 Td

/F2 18 Tf
${brandRed} rg
(Cost Comparison and Savings) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Current Estimated Monthly Cost:) Tj
200 0 Td
(${formattedHumanCost}/month) Tj
-200 -25 Td
(AI Solution Monthly Cost:) Tj
200 0 Td
(${formattedTotalCost}/month) Tj
-200 -25 Td
(Monthly Savings:) Tj
200 0 Td
${brandRed} rg
(${formattedMonthlySavings}/month) Tj
0 0 0 rg
-200 -25 Td
(Annual Savings:) Tj
200 0 Td
${brandRed} rg
(${formattedYearlySavings}/year) Tj
0 0 0 rg
-200 -25 Td
(Savings Percentage:) Tj
200 0 Td
${brandRed} rg
(${formattedSavingsPercentage}) Tj
0 0 0 rg
-200 -45 Td

/F2 18 Tf
${brandRed} rg
(Return on Investment) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Based on the projected savings and implementation costs, your expected ROI timeline is:) Tj
0 -30 Td
(\\267 Break-even Point: ${breakEvenMonths} months) Tj
0 -25 Td
(\\267 First Year ROI: ${firstYearROI}%) Tj
0 -25 Td
(\\267 Five-Year Total Savings: ${formatPdfCurrency(fiveYearSavings)}) Tj
0 0 0 rg
ET
Q`;
  return content;
}
