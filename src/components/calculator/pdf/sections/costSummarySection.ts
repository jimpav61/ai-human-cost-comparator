
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';
import { CalculationResults } from '@/hooks/useCalculator';

export const addCostSummarySection = (
  doc: JsPDFWithAutoTable, 
  yPosition: number,
  results: CalculationResults
): number => {
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Cost Summary", 20, yPosition);
  
  // Ensure we have valid numbers to prevent NaN in the report
  const humanCostMonthly = isNaN(results.humanCostMonthly) ? 5000 : results.humanCostMonthly;
  const aiCostMonthlyTotal = isNaN(results.aiCostMonthly.total) ? 99 : results.aiCostMonthly.total;
  const setupFee = isNaN(results.aiCostMonthly.setupFee) ? 1149 : results.aiCostMonthly.setupFee;
  const monthlySavings = isNaN(results.monthlySavings) ? 4000 : results.monthlySavings;
  const yearlySavings = isNaN(results.yearlySavings) ? 48000 : results.yearlySavings;
  
  console.log("Cost Summary values:", {
    humanCostMonthly,
    aiCostMonthlyTotal,
    setupFee,
    monthlySavings,
    yearlySavings
  });
  
  const costData = [
    ["Current Human Resources Cost", formatCurrency(humanCostMonthly), formatCurrency(humanCostMonthly * 12), "N/A"],
    ["ChatSites.ai Solution (Your Cost)", formatCurrency(aiCostMonthlyTotal), formatCurrency(aiCostMonthlyTotal * 12), formatCurrency(setupFee)],
    ["Potential Savings", formatCurrency(monthlySavings), formatCurrency(yearlySavings), "N/A"]
  ];

  autoTable(doc, {
    startY: yPosition + 5,
    head: [["Category", "Monthly Cost", "Annual Cost", "One-Time Setup Fee"]],
    body: costData,
    styles: { fontSize: 11 },
    bodyStyles: { textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    // Use a more specific styling approach for individual rows
    willDrawCell: function(data) {
      // Highlight the AI Solution row with a green background
      if (data.row.index === 1 && data.section === 'body') {
        data.cell.styles.fillColor = [226, 240, 217];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Return the position after the table
  return (doc as any).lastAutoTable.finalY + 15;
};
