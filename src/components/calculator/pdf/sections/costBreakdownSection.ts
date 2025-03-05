
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';

export const addCostBreakdownSection = (
  doc: JsPDFWithAutoTable, 
  yPosition: number,
  basePriceMonthly?: number,
  additionalVoiceMinutes?: number,
  totalMonthlyCost?: number
): number => {
  console.log("Cost Breakdown values for PDF:", {
    basePriceMonthly,
    additionalVoiceMinutes,
    totalMonthlyCost
  });
  
  // Ensure we have valid values
  const basePrice = typeof basePriceMonthly === 'number' ? basePriceMonthly : 229;
  const voiceMinutes = typeof additionalVoiceMinutes === 'number' ? additionalVoiceMinutes : 0;
  
  // Calculate additional voice cost (12 cents per minute)
  const additionalVoiceCost = voiceMinutes > 0 ? voiceMinutes * 0.12 : 0;
  
  // Calculate the total including additional voice costs
  const totalCost = typeof totalMonthlyCost === 'number' ? 
    totalMonthlyCost : 
    basePrice + additionalVoiceCost;
  
  // Cost Breakdown Section
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header
  doc.text("Cost Breakdown", 20, yPosition);
  
  yPosition += 8;
  
  // Cost breakdown table - one row for base price and another for voice if applicable
  const tableRows = [];
  
  // Always add the base AI service
  tableRows.push(['AI Service Base', formatCurrency(basePrice)]);
  
  // Add additional voice minutes if applicable
  if (voiceMinutes > 0) {
    // Calculate cost of additional minutes (12 cents per minute)
    const additionalMinutesRate = 0.12;
    tableRows.push([
      `Additional Voice Minutes (${voiceMinutes} @ ${formatCurrency(additionalMinutesRate)}/min)`, 
      formatCurrency(additionalVoiceCost)
    ]);
  }
  
  // Add total
  tableRows.push(['Monthly Total', formatCurrency(totalCost)]);
  
  // Create the breakdown table with same styling as frontend
  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Monthly Cost']],
    body: tableRows,
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
      0: { fontStyle: 'normal' },
      1: { halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Return the new y position
  return (doc as any).lastAutoTable.finalY + 15;
};
