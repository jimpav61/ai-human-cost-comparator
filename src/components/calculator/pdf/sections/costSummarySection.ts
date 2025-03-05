
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
  
  // Use original values directly, preserving the information exactly as in the front-end
  // Ensure these are numbers and not strings or undefined
  const humanCostMonthly = Number(results.humanCostMonthly) || 0;
  const aiCostMonthlyTotal = Number(results.aiCostMonthly.total) || 0;
  const setupFee = Number(results.aiCostMonthly.setupFee) || 0;
  const monthlySavings = Number(results.monthlySavings) || 0;
  const yearlySavings = Number(results.yearlySavings) || 0;
  
  console.log("Cost Summary values:", {
    humanCostMonthly,
    aiCostMonthlyTotal,
    setupFee,
    monthlySavings,
    yearlySavings,
    original: results
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
