
import { JsPDFWithAutoTable } from '../types';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';
import { AI_RATES } from '@/constants/pricing';

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
  
  // Calculate realistic ROI timeline in months, not days
  // Base value of 3 months minimum, adjusted by company size
  let minMonths = Math.round(3 + (employeeMultiplier * 0.5));
  let maxMonths = Math.round(6 + employeeMultiplier);
  
  // Ensure a meaningful range with at least 2 months difference
  if (maxMonths - minMonths < 2) {
    maxMonths = minMonths + 2;
  }
  
  // Format ROI timeline
  const employeeBasedROI = params.employeeCount 
    ? `${minMonths} to ${maxMonths} months` 
    : "3 to 6 months";

  // Try to safely parse the yearly savings for 5-year projection
  let fiveYearSavings;
  try {
    const yearlyValue = Number(yearlySavings.replace(/[^0-9.-]+/g, ''));
    fiveYearSavings = isNaN(yearlyValue) ? formatCurrency(210000) : formatCurrency(yearlyValue * 5);
  } catch (e) {
    console.warn('Error calculating 5-year savings:', e);
    fiveYearSavings = formatCurrency(210000);
  }

  // Add the one-time setup fee to the table
  const setupFee = formatCurrency(params.results.aiCostMonthly.setupFee || 0);

  autoTable(doc, {
    startY: yPosition + 5,
    head: [["Metric", "Potential Impact"]],
    body: [
      ["Monthly Cost Reduction", monthlySavings],
      ["Annual Cost Reduction", yearlySavings],
      ["Efficiency Improvement", `${savingsPercent}%`],
      ["One-Time Setup Fee", setupFee],
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
  
  // Extract tier key from the tierName if available
  const tierName = params.tierName || '';
  const tierKey = tierName.toLowerCase().includes('starter') ? 'starter' : 
               tierName.toLowerCase().includes('growth') ? 'growth' : 
               tierName.toLowerCase().includes('premium') ? 'premium' : 
               params.results?.aiTier || 'growth';
  
  // Get the exact monthly fee from AI_RATES instead of the calculated total
  const monthlyBaseFee = AI_RATES.chatbot[tierKey]?.base || params.results.aiCostMonthly.total;
  
  autoTable(doc, {
    startY: yPosition + 5,
    head: [["Solution", "Monthly Cost", "Annual Cost", "One-Time Setup Fee"]],
    body: [
      ["Current Human Staff", formatCurrency(params.results.humanCostMonthly), formatCurrency(params.results.humanCostMonthly * 12), "N/A"],
      ["ChatSites.ai Solution (Your Cost)", formatCurrency(monthlyBaseFee), formatCurrency(monthlyBaseFee * 12), formatCurrency(params.results.aiCostMonthly.setupFee || 0)],
    ],
    styles: { fontSize: 11 },
    bodyStyles: { textColor: [0, 0, 0] },
    willDrawCell: function(data) {
      // Highlight the AI Solution row with a green background
      if (data.row.index === 1 && data.section === 'body') {
        data.cell.styles.fillColor = [226, 240, 217];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  // Get the last Y position after the table
  return (doc.lastAutoTable?.finalY || yPosition + 60) + 20;
};
