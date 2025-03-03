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
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Pricing:", 20, yPosition);

  if (params.pricingDetails && params.pricingDetails.length > 0) {
    params.pricingDetails.forEach((detail, index) => {
      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`${detail.title}: ${formatCurrency(detail.monthlyCost)}/month`, 25, yPosition);
    });
  } else {
    yPosition += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Monthly cost: ${formatCurrency(params.results.aiCostMonthly.total)}`, 25, yPosition);
  }

  return yPosition + 15;
};
