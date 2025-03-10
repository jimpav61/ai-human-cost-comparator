
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency, formatNumber } from '@/utils/formatters';
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
  
  // Calculate additional voice cost - but only for minutes BEYOND the included amount
  // For admin panel, we need to explicitly calculate this 
  const additionalVoiceCost = 
    (typeof additionalVoiceMinutes === 'number' && additionalVoiceMinutes > 0) ? 
    additionalVoiceMinutes * 0.12 : 0;
  
  // Use total cost if provided, otherwise calculate it
  const totalCost = typeof totalMonthlyCost === 'number' ? 
    totalMonthlyCost : (basePrice + additionalVoiceCost);
  
  // Cost Breakdown Section
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header
  doc.text("Cost Breakdown", 20, yPosition);
  
  yPosition += 8;
  
  // Cost breakdown table
  const tableRows = [];
  
  // Always add the base AI service
  tableRows.push(['AI Service Base', formatCurrency(basePrice)]);
  
  // Add additional voice minutes if applicable - only show when there are actual minutes
  if (additionalVoiceMinutes && additionalVoiceMinutes > 0) {
    tableRows.push([`Additional Voice Minutes (${formatNumber(additionalVoiceMinutes)}) @ $0.12/min`, formatCurrency(additionalVoiceCost)]);
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
      fontStyle: 'bold' as 'bold' // Type assertion to fix the same FontStyle issue
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
      0: { fontStyle: 'normal' as 'normal' }, // Add type assertion for fontStyle
      1: { halign: 'right' as 'right' }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Return the new y position
  return (doc as any).lastAutoTable.finalY + 15;
};
