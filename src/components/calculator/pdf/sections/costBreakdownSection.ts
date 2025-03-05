
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
  // Ensure values are numbers
  const safeBasePrice = Number(basePriceMonthly) || 0;
  const safeAdditionalMinutes = Number(additionalVoiceMinutes) || 0;
  const safeTotalCost = Number(totalMonthlyCost) || 0;
  
  // Only proceed if we have a base price to show
  if (safeBasePrice <= 0) {
    return yPosition;
  }
  
  // Cost Breakdown Section
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header
  doc.text("Cost Breakdown", 20, yPosition);
  
  yPosition += 8;
  
  // Cost breakdown table - one row for base price and another for voice if applicable
  const tableRows = [];
  
  // Always add the base AI service
  tableRows.push(['AI Service Base', formatCurrency(safeBasePrice)]);
  
  // Add additional voice minutes if applicable
  if (safeAdditionalMinutes > 0) {
    // Calculate cost of additional minutes (12 cents per minute)
    const additionalMinutesRate = 0.12;
    const additionalVoiceCost = safeAdditionalMinutes * additionalMinutesRate;
    tableRows.push([
      `Additional Voice Minutes (${safeAdditionalMinutes} @ ${formatCurrency(additionalMinutesRate)}/min)`, 
      formatCurrency(additionalVoiceCost)
    ]);
  }
  
  // Add total if we have it
  if (safeTotalCost > 0) {
    tableRows.push(['Monthly Total', formatCurrency(safeTotalCost)]);
  }
  
  // Create the breakdown table
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
