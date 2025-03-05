
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';

export const addCostBreakdownSection = (
  doc: JsPDFWithAutoTable, 
  yPosition: number,
  basePriceMonthly: number = 0,
  additionalVoiceMinutes?: number,
  totalMonthlyAICost?: number
): number => {
  // Always add the section to ensure consistent reporting
  const hasAdditionalVoice = additionalVoiceMinutes && additionalVoiceMinutes > 0;
  
  console.log("Cost breakdown section - addVoiceMin:", additionalVoiceMinutes, "hasVoice:", hasAdditionalVoice);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Cost Breakdown", 20, yPosition);
  
  // Ensure we have valid numbers to prevent NaN in the report
  const basePriceSafe = isNaN(basePriceMonthly) ? 99 : basePriceMonthly;
  const additionalVoiceCost = hasAdditionalVoice ? (additionalVoiceMinutes || 0) * 0.12 : 0;
  const totalCostSafe = isNaN(totalMonthlyAICost) ? (basePriceSafe + additionalVoiceCost) : totalMonthlyAICost;
  
  console.log("Cost breakdown values:", {
    basePriceSafe,
    additionalVoiceCost,
    totalCostSafe
  });
  
  // Determine what rows to show based on the available data
  let breakdownData = [];
  
  if (hasAdditionalVoice) {
    breakdownData = [
      ["Base Monthly Plan", formatCurrency(basePriceSafe)],
      ["Additional Voice Minutes", formatCurrency(additionalVoiceCost)],
      ["Total Monthly Cost", formatCurrency(totalCostSafe)]
    ];
  } else {
    breakdownData = [
      ["Base Monthly Plan", formatCurrency(basePriceSafe)],
      ["Total Monthly Cost", formatCurrency(totalCostSafe)]
    ];
  }
  
  autoTable(doc, {
    startY: yPosition + 5,
    head: [["Item", "Cost"]],
    body: breakdownData,
    styles: { fontSize: 11 },
    headStyles: { fillColor: [200, 230, 201] },
    bodyStyles: { textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });
  
  return (doc as any).lastAutoTable.finalY + 15;
};
