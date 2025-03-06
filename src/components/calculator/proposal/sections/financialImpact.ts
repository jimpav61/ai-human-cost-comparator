
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
  doc.setTextColor(0, 0, 0); // Regular text in black
  
  // Format financial values - use values from results or fall back to defaults
  // Ensure we have valid results with fallbacks for missing properties
  const resultsData = params.results || {} as SharedResults;
  
  // Safely extract values and ensure they are numbers
  const humanCost = Number(resultsData.humanCostMonthly) || 15000;
  
  // For AI cost, we need to carefully consider additional voice minutes
  const basePrice = Number(resultsData.basePriceMonthly) || 499;
  
  // Extract voice minutes and included minutes
  const additionalVoiceMinutes = Number(params.additionalVoiceMinutes) || 0;
  const includedVoiceMinutes = params.tierName?.toLowerCase().includes('starter') ? 0 : 600;
  
  // Calculate additional voice cost - only for minutes beyond the included amount
  const chargeableMinutes = Math.max(0, additionalVoiceMinutes - includedVoiceMinutes);
  const additionalVoiceCost = chargeableMinutes * 0.12;
  
  // The total AI cost should include any additional voice costs
  const aiCost = basePrice + additionalVoiceCost;
  const setupFee = Number(resultsData.aiCostMonthly?.setupFee) || 1149;
  
  // Recalculate savings with additional voice costs included
  const monthlySavings = humanCost - aiCost;
  const yearlySavings = monthlySavings * 12;
  const savingsPercent = (monthlySavings / humanCost) * 100;
  
  const humanCostFormatted = formatCurrency(humanCost);
  const aiCostFormatted = formatCurrency(aiCost);
  const setupFeeFormatted = formatCurrency(setupFee);
  const monthlySavingsFormatted = formatCurrency(monthlySavings);
  const yearlySavingsFormatted = formatCurrency(yearlySavings);
  const savingsPercentFormatted = formatPercent(savingsPercent);
  
  // Introduction text for financial impact
  let financialText = `Our AI solution offers significant cost reductions compared to traditional staffing. The potential monthly savings for ${params.companyName} is ${monthlySavingsFormatted}, which represents ${savingsPercentFormatted} of your current staffing costs for this function.`;
  
  // Add voice minutes information if applicable
  if (additionalVoiceMinutes > 0) {
    if (chargeableMinutes > 0) {
      financialText += ` Your solution includes ${formatNumber(additionalVoiceMinutes)} voice minutes (${formatNumber(includedVoiceMinutes)} included in your plan + ${formatNumber(chargeableMinutes)} additional minutes at ${formatCurrency(additionalVoiceCost)}).`;
    } else {
      financialText += ` Your solution includes ${formatNumber(additionalVoiceMinutes)} voice minutes, which are fully covered within your plan's included minutes.`;
    }
  }
  
  const splitFinancialText = doc.splitTextToSize(financialText, 170);
  doc.text(splitFinancialText, 20, yPosition);
  
  yPosition += splitFinancialText.length * 7 + 10;
  
  // Financial comparison table - using autoTable as a function instead of a method
  autoTable(doc, {
    startY: yPosition,
    head: [['', 'Monthly Cost', 'Annual Cost']],
    body: [
      ['Current Human Staff', humanCostFormatted, formatCurrency(humanCost * 12)],
      ['ChatSites.ai Solution', aiCostFormatted, formatCurrency(aiCost * 12)],
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
  
  // Get the final Y position
  yPosition = (doc as any).lastAutoTable.finalY + 10;
  
  // Setup fee and ROI notes
  doc.setFontSize(11);
  doc.text(`One-time setup fee: ${setupFeeFormatted}`, 20, yPosition);
  
  yPosition += 7;
  
  // Calculate ROI
  const yearlyAiCost = aiCost * 12 + setupFee;
  const roi = (yearlySavings / yearlyAiCost) * 100;
  const paybackPeriod = Math.ceil((setupFee / monthlySavings) * 10) / 10; // Round to 1 decimal place
  
  doc.text(`Return on Investment (ROI): ${formatPercent(roi)} in the first year`, 20, yPosition);
  
  yPosition += 7;
  
  doc.text(`Setup fee payback period: ${paybackPeriod} months`, 20, yPosition);
  
  // Add explicit breakdown of costs if there are additional voice minutes
  if (additionalVoiceMinutes > 0) {
    yPosition += 10;
    doc.setFontSize(11);
    doc.text("Cost Breakdown:", 20, yPosition);
    
    yPosition += 6;
    doc.text(`Base Plan (${params.tierName}): ${formatCurrency(basePrice)}/month`, 20, yPosition);
    
    yPosition += 6;
    if (chargeableMinutes > 0) {
      doc.text(`Additional Voice Minutes (${formatNumber(chargeableMinutes)} @ $0.12/min): ${formatCurrency(additionalVoiceCost)}/month`, 20, yPosition);
    } else {
      doc.text(`Voice Minutes (${formatNumber(additionalVoiceMinutes)}): Included in plan`, 20, yPosition);
    }
    
    if (chargeableMinutes > 0) {
      yPosition += 6;
      doc.text(`Total Monthly Cost: ${formatCurrency(aiCost)}/month`, 20, yPosition);
    }
  }
  
  return yPosition + 15;
};
