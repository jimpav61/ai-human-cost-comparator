
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';
import { CalculationResults } from '@/hooks/calculator/types';

export const addCostBreakdownSection = (
  doc: JsPDFWithAutoTable, 
  yPosition: number,
  results: CalculationResults
): number => {
  console.log("Cost Breakdown values for PDF:", {
    basePriceMonthly: results.basePriceMonthly,
    voiceCost: results.aiCostMonthly.voice,
    totalMonthlyCost: results.aiCostMonthly.total
  });
  
  // Cost Breakdown Section
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header
  doc.text("Cost Breakdown", 20, yPosition);
  
  yPosition += 8;
  
  // Cost breakdown table
  const tableRows = [];
  
  // Always add the base AI service
  tableRows.push(['AI Service Base', formatCurrency(results.basePriceMonthly)]);
  
  // Add voice cost if applicable - only show when there's an actual voice cost
  if (results.aiCostMonthly.voice > 0) {
    // Don't recalculate - display the pre-calculated voice cost
    tableRows.push(['Voice AI Service', formatCurrency(results.aiCostMonthly.voice)]);
  }
  
  // Add total - use the pre-calculated total
  tableRows.push(['Monthly Total', formatCurrency(results.aiCostMonthly.total)]);
  
  // Create the breakdown table with same styling as frontend
  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Monthly Cost']],
    body: tableRows,
    headStyles: {
      fillColor: [246, 82, 40] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold' as 'bold'
    },
    bodyStyles: {
      textColor: [0, 0, 0] as [number, number, number]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245] as [number, number, number]
    },
    styles: {
      fontSize: 11
    },
    columnStyles: {
      0: { fontStyle: 'normal' as 'normal' },
      1: { halign: 'right' as 'right' }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Return the new y position
  return (doc as any).lastAutoTable.finalY + 15;
};
