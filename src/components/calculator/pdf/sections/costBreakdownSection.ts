
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';

export const addCostBreakdownSection = (
  doc: JsPDFWithAutoTable, 
  yPosition: number,
  basePriceMonthly: number,
  additionalVoiceMinutes?: number,
  totalMonthlyAICost?: number
): number => {
  // Always show the section if totalMonthlyAICost is provided
  // But still check for voice minutes for content presentation
  const hasAdditionalVoice = additionalVoiceMinutes && additionalVoiceMinutes > 0;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Cost Breakdown", 20, yPosition);
  
  const additionalVoiceCost = hasAdditionalVoice ? additionalVoiceMinutes * 0.12 : 0;
  
  // Determine what rows to show based on the available data
  let breakdownData = [];
  
  if (hasAdditionalVoice) {
    breakdownData = [
      ["Base Monthly Plan", formatCurrency(basePriceMonthly)],
      ["Additional Voice Minutes", formatCurrency(additionalVoiceCost)],
      ["Total Monthly Cost", formatCurrency(totalMonthlyAICost || (basePriceMonthly + additionalVoiceCost))]
    ];
  } else {
    breakdownData = [
      ["Base Monthly Plan", formatCurrency(basePriceMonthly)],
      ["Total Monthly Cost", formatCurrency(totalMonthlyAICost || basePriceMonthly)]
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
