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
  doc.text("Financial Impact", 20, yPosition);

  yPosition += 10;
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Illustrative cost savings and potential ROI with our AI solution.", 20, yPosition);

  yPosition += 15;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Key Highlights:", 20, yPosition);

  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`• Potential Monthly Savings: ${formatCurrency(params.results.monthlySavings)}`, 25, yPosition);
  doc.text(`• Estimated Annual Savings: ${formatCurrency(params.results.yearlySavings)}`, 25, yPosition + 7);
  doc.text(`• Savings on Human Resources: ${params.results.savingsPercentage}%`, 25, yPosition + 14);

  yPosition += 25;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Detailed Breakdown:", 20, yPosition);

  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`• Current Monthly Human Resources Cost: ${formatCurrency(params.results.humanCostMonthly)}`, 25, yPosition);
  doc.text(`• Monthly Cost of AI Solution: ${formatCurrency(params.results.aiCostMonthly.total)}`, 25, yPosition + 7);

  yPosition += 20;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Projected ROI:", 20, yPosition);

  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Implementing our AI solution can lead to significant cost savings and improved efficiency, offering a substantial return on investment.", 25, yPosition);

  return yPosition + 20;
};
