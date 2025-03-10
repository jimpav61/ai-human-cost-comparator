
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
    theme: 'grid',
    styles: {
      fontSize: 11,
      cellPadding: 5,
      overflow: 'linebreak',
      halign: 'left',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [80, 80, 80],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: effectiveWidth * 0.6 },
      1: { cellWidth: effectiveWidth * 0.4, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    startY: startY
  };
  
  // Create formatted cost data
  const monthlySavings = formatCurrency(results.monthlySavings);
  const yearlySavings = formatCurrency(results.yearlySavings);
  const savingsPercentage = `${Math.round(results.savingsPercentage)}%`;
  
  // Setup cost comparison table with two columns
  autoTable(doc, {
    ...tableStyles,
    body: [
      ['Current Estimated Monthly Cost:', formatCurrency(results.humanCostMonthly)],
      ['AI Solution Monthly Cost:', formatCurrency(results.aiCostMonthly.total)],
      ['Monthly Savings:', { content: monthlySavings, styles: { textColor: [255, 67, 42] } }],
      ['Annual Savings:', { content: yearlySavings, styles: { textColor: [255, 67, 42] } }],
      ['Savings Percentage:', { content: savingsPercentage, styles: { textColor: [255, 67, 42] } }]
    ]
  });
  
  // Get the new Y position after the table is drawn
  const finalY = (doc.lastAutoTable?.finalY || startY) + 15;
  return finalY;
};
