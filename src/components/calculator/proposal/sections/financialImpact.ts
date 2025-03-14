
import { JsPDFWithAutoTable, SectionParams } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';
import { SharedResults } from '../../shared/types';

export const addFinancialImpact = (doc: JsPDFWithAutoTable, yPosition: number, params: SectionParams): number => {
  // Financial Impact Section
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header
  doc.text("Financial Impact", 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  // CRUCIAL FIX: Extract and validate voice-related parameters
  // Ensure additionalVoiceMinutes is properly extracted as a number
  let additionalVoiceMinutes = 0;
  if (typeof params.additionalVoiceMinutes === 'number') {
    additionalVoiceMinutes = params.additionalVoiceMinutes;
  } else if (typeof params.additionalVoiceMinutes === 'string') {
    additionalVoiceMinutes = parseInt(params.additionalVoiceMinutes, 10) || 0;
  }
  
  // Log voice minutes data for debugging
  console.log("Financial Impact - Voice minutes data:", {
    additionalVoiceMinutes,
    params_additionalVoiceMinutes: params.additionalVoiceMinutes,
    type: typeof params.additionalVoiceMinutes
  });
  
  const tierKey = params.tierName?.toLowerCase().includes('starter') ? 'starter' : 
                params.tierName?.toLowerCase().includes('growth') ? 'growth' : 
                params.tierName?.toLowerCase().includes('premium') ? 'premium' : 'growth';
  
  // FIXED: Always use 600 included minutes for non-starter tiers
  const includedVoiceMinutes = tierKey === 'starter' ? 0 : 600;
  
  console.log("Financial Impact - Voice minutes:", {
    additionalVoiceMinutes,
    includedVoiceMinutes,
    tierName: params.tierName,
    tierKey
  });
  
  // Calculate voice costs
  const additionalVoiceCost = additionalVoiceMinutes * 0.12;
  
  // Get base price based on tier
  const basePrice = tierKey === 'starter' ? 99 :
                   tierKey === 'growth' ? 229 :
                   tierKey === 'premium' ? 429 : 229;
  
  // Calculate total AI cost
  const totalAICost = basePrice + additionalVoiceCost;
  
  // Get human cost (with fallback)
  const humanCost = Number(params.results?.humanCostMonthly) || 15000;
  
  // Calculate savings
  const monthlySavings = humanCost - totalAICost;
  const yearlySavings = monthlySavings * 12;
  const savingsPercent = (monthlySavings / humanCost) * 100;
  
  // Format values for display
  const humanCostFormatted = formatCurrency(humanCost);
  const aiCostFormatted = formatCurrency(totalAICost);
  const monthlySavingsFormatted = formatCurrency(monthlySavings);
  const yearlySavingsFormatted = formatCurrency(yearlySavings);
  const savingsPercentFormatted = formatPercent(savingsPercent);
  const setupFee = params.results?.aiCostMonthly?.setupFee || 749;
  
  // Introduction text with voice minutes info
  let financialText = `Our AI solution offers significant cost reductions compared to traditional staffing. `;
  
  // For Growth and Premium plans, always mention voice capabilities
  if (tierKey !== 'starter') {
    if (additionalVoiceMinutes > 0) {
      financialText += `Your plan includes ${formatNumber(includedVoiceMinutes)} voice minutes at no extra cost, plus ${formatNumber(additionalVoiceMinutes)} additional minutes at $0.12/minute (${formatCurrency(additionalVoiceCost)}/month). `;
    } else {
      financialText += `Your plan includes ${formatNumber(includedVoiceMinutes)} voice minutes at no extra cost. `;
    }
  }
  
  financialText += `The potential monthly savings for ${params.companyName} is ${monthlySavingsFormatted}, representing ${savingsPercentFormatted} of your current staffing costs.`;
  
  const splitFinancialText = doc.splitTextToSize(financialText, 170);
  doc.text(splitFinancialText, 20, yPosition);
  
  yPosition += splitFinancialText.length * 7 + 10;
  
  // Financial comparison table
  autoTable(doc, {
    startY: yPosition,
    head: [['', 'Monthly Cost', 'Annual Cost']],
    body: [
      ['Current Human Staff', humanCostFormatted, formatCurrency(humanCost * 12)],
      ['ChatSites.ai Solution', aiCostFormatted, formatCurrency(totalAICost * 12)],
      ['Your Savings', monthlySavingsFormatted, yearlySavingsFormatted],
    ],
    headStyles: {
      fillColor: [246, 82, 40],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: [0, 0, 0]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    styles: {
      fontSize: 11
    },
    columnStyles: {
      0: { fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 }
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 10;
  
  // Setup fee and ROI information
  const setupFeeFormatted = formatCurrency(setupFee);
  doc.setFontSize(11);
  doc.text(`One-time setup fee: ${setupFeeFormatted}`, 20, yPosition);
  yPosition += 7;
  
  // Calculate and display ROI
  const yearlyAiCost = totalAICost * 12 + setupFee;
  const roi = (yearlySavings / yearlyAiCost) * 100;
  const paybackPeriod = Math.ceil((setupFee / monthlySavings) * 10) / 10;
  
  doc.text(`Return on Investment (ROI): ${formatPercent(roi)} in the first year`, 20, yPosition);
  yPosition += 7;
  doc.text(`Setup fee payback period: ${paybackPeriod} months`, 20, yPosition);
  
  // CRUCIAL FIX: Cost breakdown section for voice minutes - always show this section clearly
  yPosition += 10;
  doc.setFontSize(11);
  doc.setTextColor(35, 35, 35);
  doc.setFont(undefined, 'bold');
  doc.text("Monthly Cost Breakdown:", 20, yPosition);
  doc.setFont(undefined, 'normal');
  
  yPosition += 6;
  doc.text(`Base Plan (${params.tierName}): ${formatCurrency(basePrice)}/month`, 20, yPosition);
  
  // For Growth and Premium plans, always show voice minutes info
  if (tierKey !== 'starter') {
    yPosition += 6;
    doc.text(`Included Voice Minutes: ${formatNumber(includedVoiceMinutes)} minutes`, 20, yPosition);
    
    if (additionalVoiceMinutes > 0) {
      yPosition += 6;
      doc.text(`Additional Voice Minutes: ${formatNumber(additionalVoiceMinutes)} minutes at $0.12/min`, 20, yPosition);
      
      yPosition += 6;
      doc.text(`Additional Voice Cost: ${formatCurrency(additionalVoiceCost)}/month`, 20, yPosition);
    }
    
    yPosition += 6;
    doc.setFont(undefined, 'bold');
    doc.text(`Total Monthly Cost: ${formatCurrency(totalAICost)}/month`, 20, yPosition);
    doc.setFont(undefined, 'normal');
  }
  
  return yPosition + 15;
};
