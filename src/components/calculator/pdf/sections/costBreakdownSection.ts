
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
  // Only add this section if there are additional voice minutes
  if (!additionalVoiceMinutes || additionalVoiceMinutes <= 0) {
    return yPosition;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Cost Breakdown", 20, yPosition);
  
  const additionalVoiceCost = additionalVoiceMinutes * 0.12;
  const breakdownData = [
    ["Base Monthly Plan", formatCurrency(basePriceMonthly)],
    ["Additional Voice Minutes", formatCurrency(additionalVoiceCost)],
    ["Total Monthly Cost", formatCurrency(totalMonthlyAICost || (basePriceMonthly + additionalVoiceCost))]
  ];
  
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
