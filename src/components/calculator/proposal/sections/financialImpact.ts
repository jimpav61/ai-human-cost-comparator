
import { JsPDFWithAutoTable } from '../types';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';

export const addFinancialImpact = (doc: JsPDFWithAutoTable, yPosition: number, params: any): number => {
  // Check if we need a new page
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.text("Financial Impact & ROI Analysis", 20, yPosition);

  // Create a professional summary of savings - with safe fallbacks for all values
  const monthlySavings = formatCurrency(params.results.monthlySavings || 3500);
  const yearlySavings = formatCurrency(params.results.yearlySavings || 42000);
  const savingsPercent = Math.abs(params.results.savingsPercentage || 90).toFixed(1);

  // Calculate ROI based on employee count if available
  const employeeMultiplier = params.employeeCount ? Math.min(params.employeeCount / 10, 5) : 1;
  const employeeBasedROI = params.employeeCount ? `${Math.max(1, Math.round(3 - employeeMultiplier * 0.5))} to ${Math.round(3 + employeeMultiplier)} days` : "1 to 3 days";

  // Try to safely parse the yearly savings for 5-year projection
  let fiveYearSavings;
  try {
    const yearlyValue = Number(yearlySavings.replace(/[^0-9.-]+/g, ''));
    fiveYearSavings = isNaN(yearlyValue) ? formatCurrency(210000) : formatCurrency(yearlyValue * 5);
  } catch (e) {
    console.warn('Error calculating 5-year savings:', e);
    fiveYearSavings = formatCurrency(210000);
  }

  autoTable(doc, {
    startY: yPosition + 5,
    head: [["Metric", "Potential Impact"]],
    body: [
      ["Monthly Cost Reduction", monthlySavings],
      ["Annual Cost Reduction", yearlySavings],
      ["Efficiency Improvement", `${savingsPercent}%`],
      ["Implementation Timeline", "5 business days or less"],
      ["ROI Timeline", employeeBasedROI],
      ["5-Year Projected Savings", fiveYearSavings]
    ],
    styles: { fontSize: 11 },
    rowPageBreak: 'auto',
  });
  
  // Get the last Y position after the table
  const finalY = doc.lastAutoTable?.finalY || yPosition + 60;
  
  // Add a cost comparison table
  yPosition = finalY + 15;
  doc.setFontSize(12);
  doc.text("Cost Comparison", 20, yPosition);
  
  autoTable(doc, {
    startY: yPosition + 5,
    head: [["Solution", "Monthly Cost", "Annual Cost"]],
    body: [
      ["Current Human Staff", formatCurrency(params.results.humanCostMonthly), formatCurrency(params.results.humanCostMonthly * 12)],
      ["ChatSites.ai Solution (Your Cost)", formatCurrency(params.results.aiCostMonthly.total), formatCurrency(params.results.aiCostMonthly.total * 12)],
    ],
    styles: { fontSize: 11 },
    bodyStyles: { textColor: [0, 0, 0] },
    rowStyles: {
      1: { fillColor: [226, 240, 217], fontStyle: 'bold' } // Light green background for AI Solution row
    },
  });
  
  // Get the last Y position after the table
  return (doc.lastAutoTable?.finalY || yPosition + 60) + 20;
};
