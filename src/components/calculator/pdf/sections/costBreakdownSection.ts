
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
  console.log("Cost breakdown inputs - basePrice:", basePriceMonthly, "totalCost:", totalMonthlyAICost);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Cost Breakdown", 20, yPosition);
  
  // Use original values without unnecessary fallbacks
  // Only provide fallbacks if the values are explicitly undefined or NaN
  const basePriceSafe = basePriceMonthly;
  const additionalVoiceCost = hasAdditionalVoice ? (additionalVoiceMinutes || 0) * 0.12 : 0;
  const totalCostSafe = totalMonthlyAICost !== undefined ? totalMonthlyAICost : (basePriceSafe + additionalVoiceCost);
  
  console.log("Cost breakdown values (preserving originals):", {
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
