
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';
import { CalculationResults } from '@/hooks/useCalculator';

export const addCostSummarySection = (
  doc: JsPDFWithAutoTable,
  startY: number,
  results: CalculationResults
): number => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const effectiveWidth = pageWidth - 2 * margin;
  
  doc.setFontSize(16);
  doc.setTextColor(255, 67, 42); // Brand red color for headers
  doc.text('Cost Comparison and Savings', margin, startY);
  
  startY += 15;
  
  // Set table styling
  const tableStyles = {
    styles: {
      fontSize: 11,
      cellPadding: 5,
      overflow: 'linebreak' as 'linebreak',
      halign: 'left' as 'left',
      valign: 'middle' as 'middle'
    },
    headStyles: {
      // Fix: explicitly define RGB color as a tuple with fixed length
      fillColor: [245, 245, 245] as [number, number, number],
      textColor: [80, 80, 80] as [number, number, number],
      fontStyle: 'bold' as 'bold' // Fix: use 'bold' as const to match FontStyle type
    },
    columnStyles: {
      0: { cellWidth: effectiveWidth * 0.6 },
      1: { cellWidth: effectiveWidth * 0.4, halign: 'right' as 'right' }
    },
    margin: { left: margin, right: margin },
    startY: startY
  };
  
  // Create formatted cost data for one employee replacement
  const monthlySavings = formatCurrency(results.monthlySavings);
  const yearlySavings = formatCurrency(results.yearlySavings);
  const savingsPercentage = `${Math.round(results.savingsPercentage)}%`;
  
  // Setup cost comparison table with clarification about one employee
  autoTable(doc, {
    ...tableStyles,
    body: [
      ['Current Monthly Cost (One Employee):', formatCurrency(results.humanCostMonthly)],
      ['AI Solution Monthly Cost:', formatCurrency(results.aiCostMonthly.total)],
      ['Monthly Savings (Per Employee):', { content: monthlySavings, styles: { textColor: [255, 67, 42] as [number, number, number] } }],
      ['Annual Savings (Per Employee):', { content: yearlySavings, styles: { textColor: [255, 67, 42] as [number, number, number] } }],
      ['Savings Percentage:', { content: savingsPercentage, styles: { textColor: [255, 67, 42] as [number, number, number] } }]
    ]
  });
  
  // Get the new Y position after the table is drawn
  const finalY = (doc.lastAutoTable?.finalY || startY) + 15;
  return finalY;
};
