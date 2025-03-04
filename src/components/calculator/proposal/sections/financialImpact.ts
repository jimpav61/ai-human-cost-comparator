
import { JsPDFWithAutoTable, SectionParams } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';

export const addFinancialImpact = (doc: JsPDFWithAutoTable, yPosition: number, params: SectionParams): number => {
  // Financial Impact Section
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header
  doc.text("Financial Impact", 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Regular text in black
  
  // Format financial values
  const humanCost = params.results?.humanCostMonthly || 15000;
  const aiCost = params.results?.aiCostMonthly?.total || 499;
  const setupFee = params.results?.aiCostMonthly?.setupFee || 1149;
  const monthlySavings = params.results?.monthlySavings || 14500;
  const yearlySavings = params.results?.yearlySavings || 174000;
  const savingsPercent = params.results?.savingsPercentage || 96;
  
  const humanCostFormatted = formatCurrency(humanCost);
  const aiCostFormatted = formatCurrency(aiCost);
  const setupFeeFormatted = formatCurrency(setupFee);
  const monthlySavingsFormatted = formatCurrency(monthlySavings);
  const yearlySavingsFormatted = formatCurrency(yearlySavings);
  const savingsPercentFormatted = formatPercent(savingsPercent);
  
  // Introduction text for financial impact
  const financialText = `Our AI solution offers significant cost reductions compared to traditional staffing. The potential monthly savings for ${params.companyName} is ${monthlySavingsFormatted}, which represents ${savingsPercentFormatted} of your current staffing costs for this function.`;
  
  const splitFinancialText = doc.splitTextToSize(financialText, 170);
  doc.text(splitFinancialText, 20, yPosition);
  
  yPosition += splitFinancialText.length * 7 + 10;
  
  // Financial comparison table
  doc.autoTable({
    startY: yPosition,
    head: [['', 'Monthly Cost', 'Annual Cost']],
    body: [
      ['Current Human Staff', humanCostFormatted, formatCurrency(humanCost * 12)],
      ['ChatSites.ai Solution', aiCostFormatted, formatCurrency(aiCost * 12)],
      ['Your Savings', monthlySavingsFormatted, yearlySavingsFormatted],
    ],
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
      0: { fontStyle: 'bold' }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Get the final Y position
  yPosition = (doc as any).lastAutoTable.finalY + 10;
  
  // Setup fee and ROI notes
  doc.setFontSize(11);
  doc.text(`One-time setup fee: ${setupFeeFormatted}`, 20, yPosition);
  
  yPosition += 7;
  
  // Calculate ROI
  const yearlyAiCost = aiCost * 12 + setupFee;
  const roi = (yearlySavings / yearlyAiCost) * 100;
  const paybackPeriod = Math.ceil((setupFee / monthlySavings) * 10) / 10; // Round to 1 decimal place
  
  doc.text(`Return on Investment (ROI): ${formatPercent(roi)} in the first year`, 20, yPosition);
  
  yPosition += 7;
  
  doc.text(`Setup fee payback period: ${paybackPeriod} months`, 20, yPosition);
  
  return yPosition + 15;
};
