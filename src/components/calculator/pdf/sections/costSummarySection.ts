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
  
  const humanCostMonthly = results.humanCostMonthly;
  const aiCostMonthly = results.aiCostMonthly?.total;
  const monthlySavings = results.monthlySavings;
  const yearlySavings = results.yearlySavings;
  const savingsPercentage = results.savingsPercentage;
  
  const formattedHumanCost = formatCurrency(humanCostMonthly);
  const formattedAICost = formatCurrency(aiCostMonthly);
  const formattedMonthlySavings = formatCurrency(monthlySavings);
  const formattedYearlySavings = formatCurrency(yearlySavings);
  const formattedSavingsPercentage = `${Math.round(savingsPercentage)}%`;
  
  doc.setFontSize(16);
  doc.setTextColor(255, 67, 42); // Brand red color for headers
  doc.text('Cost Comparison and Savings', margin, startY);
  
  startY += 15;
  
  const tableStyles = {
    styles: {
      fontSize: 11,
      cellPadding: 5,
      overflow: 'linebreak' as 'linebreak',
      halign: 'left' as 'left',
      valign: 'middle' as 'middle'
    },
    headStyles: {
      fillColor: [245, 245, 245] as [number, number, number],
      textColor: [80, 80, 80] as [number, number, number],
      fontStyle: 'bold' as 'bold'
    },
    columnStyles: {
      0: { cellWidth: effectiveWidth * 0.6 },
      1: { cellWidth: effectiveWidth * 0.4, halign: 'right' as 'right' }
    },
    margin: { left: margin, right: margin },
    startY: startY
  };
  
  autoTable(doc, {
    ...tableStyles,
    body: [
      ['Current Estimated Monthly Cost:', formattedHumanCost],
      ['AI Solution Monthly Cost:', formattedAICost],
      ['Monthly Savings:', { content: formattedMonthlySavings, styles: { textColor: [255, 67, 42] as [number, number, number] } }],
      ['Annual Savings:', { content: formattedYearlySavings, styles: { textColor: [255, 67, 42] as [number, number, number] } }],
      ['Savings Percentage:', { content: formattedSavingsPercentage, styles: { textColor: [255, 67, 42] as [number, number, number] } }]
    ]
  });
  
  let finalY = startY;
  
  if (typeof (doc as any).__autoTableLastFinalY !== 'undefined') {
    finalY = (doc as any).__autoTableLastFinalY;
  } else {
    finalY = startY + 25 * 5;
  }
  
  return finalY + 15;
};
