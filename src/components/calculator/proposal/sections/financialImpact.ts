
import { JsPDFWithAutoTable } from '../types';
import { GenerateProposalParams } from '../types';
import { formatCurrency } from '@/utils/formatters';

export const addFinancialImpact = (doc: JsPDFWithAutoTable, yPosition: number, params: GenerateProposalParams): number => {
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Financial Impact & ROI Analysis", 20, yPosition);

  yPosition += 15;
  
  // Create ROI table similar to the screenshots
  const tableData = [
    ['Metric', 'Potential Impact'],
    ['Monthly Cost Reduction', formatCurrency(params.results.monthlySavings)],
    ['Annual Cost Reduction', formatCurrency(params.results.yearlySavings)],
    ['Efficiency Improvement', `${params.results.savingsPercentage.toFixed(1)}%`],
    ['Implementation Timeline', '5 business days or less'],
    ['ROI Timeline', '3 to 4 days'],
    ['5-Year Projected Savings', formatCurrency(params.results.yearlySavings * 5)]
  ];

  doc.autoTable({
    startY: yPosition,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: [0, 117, 190],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 250 },
    },
  });

  yPosition = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : yPosition + 100;
  
  // Add detailed cost breakdown as text
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Cost Breakdown:", 20, yPosition);
  yPosition += 10;
  doc.text(`• Current Monthly Human Resources Cost: ${formatCurrency(params.results.humanCostMonthly)}`, 25, yPosition);
  doc.text(`• Monthly Cost of AI Solution: ${formatCurrency(params.results.aiCostMonthly.total)}`, 25, yPosition + 7);
  doc.text(`• One-time Setup Fee: ${formatCurrency(params.results.aiCostMonthly.setupFee)}`, 25, yPosition + 14);

  return yPosition + 25;
};
