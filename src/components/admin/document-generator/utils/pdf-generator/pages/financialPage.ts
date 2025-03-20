
import { PdfContentParams } from "../types";

export function generateFinancialPage(params: PdfContentParams): string {
  const {
    brandRed,
    basePrice,
    setupFee,
    aiTier,
    includedMinutes,
    callVolume,
    additionalVoiceMinutes,
    voiceCost,
    totalPrice,
    humanCostMonthly,
    monthlySavings,
    yearlySavings,
    savingsPercentage
  } = params;
  
  // CRITICAL: Extract and validate voice minutes, preferring additionalVoiceMinutes
  const voiceMinutes = typeof additionalVoiceMinutes === 'number' ? additionalVoiceMinutes : 
                      typeof additionalVoiceMinutes === 'string' && additionalVoiceMinutes !== '' ? 
                      parseInt(additionalVoiceMinutes, 10) || 0 : 
                      typeof callVolume === 'number' ? callVolume : 
                      typeof callVolume === 'string' && callVolume !== '' ? 
                      parseInt(callVolume, 10) || 0 : 0;
  
  console.log("Financial page data - VOICE MINUTES CRITICAL:", {
    rawAdditionalVoiceMinutes: additionalVoiceMinutes,
    rawCallVolume: callVolume,
    finalVoiceMinutes: voiceMinutes,
    aiTier,
    basePrice,
    includedMinutes,
    voiceCost,
    totalPrice
  });
  
  let content = `q
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
    content += `
(Voice Capabilities:) Tj
190 0 Td
(Not included in Starter Plan) Tj
-190 -25 Td`;
  } else {
    content += `
(Included Voice Minutes:) Tj
190 0 Td
(${includedMinutes} minutes/month) Tj
-190 -25 Td`;
    
    // Use our validated voice minutes value
    if (voiceMinutes > 0) {
      content += `
(Additional Voice Minutes:) Tj
190 0 Td
(${voiceMinutes} minutes @ $0.12/minute) Tj
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

  // Total costs and savings
  content += `
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
230 0 Td
($${humanCostMonthly.toLocaleString()}/month) Tj
-230 -25 Td
(AI Solution Monthly Cost:) Tj
230 0 Td
($${totalPrice.toFixed(2)}/month) Tj
-230 -25 Td
(Monthly Savings:) Tj
230 0 Td
${brandRed} rg
($${monthlySavings.toLocaleString()}/month) Tj
0 0 0 rg
-230 -25 Td
(Annual Savings:) Tj
230 0 Td
${brandRed} rg
($${yearlySavings.toLocaleString()}/year) Tj
0 0 0 rg
-230 -25 Td
(Savings Percentage:) Tj
230 0 Td
${brandRed} rg
(${savingsPercentage}%) Tj
0 0 0 rg
-230 -45 Td

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
Q`;

  return content;
}
