
import { JsPDFWithAutoTable, GeneratePDFParams, PDFResults } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';

export const addFinancialImpact = (doc: JsPDFWithAutoTable, yPosition: number, params: GeneratePDFParams): number => {
  // Financial Impact Section
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header
  doc.text("Financial Impact", 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Regular text in black
  
  // Ensure we have valid results with fallbacks for missing properties
  const resultsData: PDFResults = params.results || {} as PDFResults;
  
  // Safely extract values with fallbacks
  const humanCost = typeof resultsData.humanCostMonthly === 'number' ? resultsData.humanCostMonthly : 15000;
  const aiCost = typeof resultsData.aiCostMonthly?.total === 'number' ? resultsData.aiCostMonthly.total : 499;
  const setupFee = typeof resultsData.aiCostMonthly?.setupFee === 'number' ? resultsData.aiCostMonthly.setupFee : 1149;
  const monthlySavings = typeof resultsData.monthlySavings === 'number' ? resultsData.monthlySavings : 14500;
  const yearlySavings = typeof resultsData.yearlySavings === 'number' ? resultsData.yearlySavings : 174000;
  const savingsPercent = typeof resultsData.savingsPercentage === 'number' ? resultsData.savingsPercentage : 96;
  
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
  
  // Financial comparison table - using autoTable as a function instead of a method
  autoTable(doc, {
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
