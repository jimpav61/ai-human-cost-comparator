
import { JsPDFWithAutoTable } from '../types';
import { GenerateProposalParams } from '../types';
import { formatCurrency } from '@/utils/formatters';

export const addRecommendedSolution = (doc: JsPDFWithAutoTable, yPosition: number, params: GenerateProposalParams): number => {
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Recommended AI Solution", 20, yPosition);

  yPosition += 10;
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Based on your industry and company size, we recommend the following AI solution:", 20, yPosition);

  yPosition += 10;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`${params.tierName} ${params.aiType} Plan`, 20, yPosition);

  yPosition += 10;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Key Features:", 20, yPosition);

  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("• 24/7 availability", 25, yPosition);
  doc.text("• Instant responses", 25, yPosition + 7);
  doc.text("• Personalized customer experience", 25, yPosition + 14);
  doc.text("• Cost savings", 25, yPosition + 21);

  yPosition += 30;
  
  // Add pricing table as in the screenshots
  const tableData = [
    ['Pricing Component', 'Details', 'Cost'],
    ['Monthly Base Fee', `${params.tierName} Plan`, formatCurrency(params.results.aiCostMonthly.total)],
    ['One-time Setup Fee', 'Non-refundable', formatCurrency(params.results.aiCostMonthly.setupFee)],
    ['Annual Plan Option', 'Includes 2 months FREE!', formatCurrency(params.results.annualPlan || params.results.aiCostMonthly.total * 10)],
    ['Estimated Monthly Savings', 'vs. current operations', formatCurrency(params.results.monthlySavings)],
    ['Projected Annual Savings', 'First year', formatCurrency(params.results.yearlySavings)]
  ];

  doc.autoTable({
    startY: yPosition,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: [0, 168, 132],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 150 },
      2: { cellWidth: 100, halign: 'right' },
    },
  });

  return doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : yPosition + 100;
};
