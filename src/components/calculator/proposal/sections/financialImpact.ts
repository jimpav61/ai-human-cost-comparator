
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
  
  // Extract and validate voice-related parameters
  const additionalVoiceMinutes = Number(params.additionalVoiceMinutes) || 0;
  const includedVoiceMinutes = params.tierName?.toLowerCase().includes('starter') ? 0 : 600;
  
  // Calculate voice costs
  const chargeableMinutes = Math.max(0, additionalVoiceMinutes - includedVoiceMinutes);
  const additionalVoiceCost = chargeableMinutes * 0.12;
  
  // Get base price based on tier
  const basePrice = params.tierName?.toLowerCase().includes('starter') ? 99 :
                   params.tierName?.toLowerCase().includes('growth') ? 229 :
                   params.tierName?.toLowerCase().includes('premium') ? 429 : 229;
  
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
  
  if (additionalVoiceMinutes > 0) {
    if (chargeableMinutes > 0) {
      financialText += `Your plan includes ${formatNumber(includedVoiceMinutes)} voice minutes at no extra cost, plus ${formatNumber(chargeableMinutes)} additional minutes at $0.12/minute (${formatCurrency(additionalVoiceCost)}/month). `;
    } else {
      financialText += `Your plan includes ${formatNumber(additionalVoiceMinutes)} voice minutes, which are fully covered within your plan's included ${formatNumber(includedVoiceMinutes)} minutes. `;
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
  
  // Cost breakdown section for voice minutes
  if (additionalVoiceMinutes > 0) {
    yPosition += 10;
    doc.setFontSize(11);
    doc.text("Monthly Cost Breakdown:", 20, yPosition);
    
    yPosition += 6;
    doc.text(`Base Plan (${params.tierName}): ${formatCurrency(basePrice)}/month`, 20, yPosition);
    
    yPosition += 6;
    if (chargeableMinutes > 0) {
      doc.text(`Additional Voice Minutes (${formatNumber(chargeableMinutes)} @ $0.12/min): ${formatCurrency(additionalVoiceCost)}/month`, 20, yPosition);
      yPosition += 6;
      doc.text(`Total Monthly Cost: ${formatCurrency(totalAICost)}/month`, 20, yPosition);
    } else {
      doc.text(`Voice Minutes (${formatNumber(additionalVoiceMinutes)}): Included in plan`, 20, yPosition);
    }
  }
  
  return yPosition + 15;
};
