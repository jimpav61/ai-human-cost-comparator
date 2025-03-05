
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
  
  // CRITICAL: Use the exact values from frontend calculator, no transformations
  const humanCostMonthly = results.humanCostMonthly;
  const aiCostMonthlyTotal = results.aiCostMonthly?.total;
  const setupFee = results.aiCostMonthly?.setupFee;
  const monthlySavings = results.monthlySavings;
  const yearlySavings = results.yearlySavings;
  
  console.log("Using EXACT frontend values for cost summary section:", {
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
    willDrawCell: function(data) {
      // Highlight the AI Solution row with a green background - matching frontend
      if (data.row.index === 1 && data.section === 'body') {
        data.cell.styles.fillColor = [226, 240, 217];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Return the position after the table
  return (doc as any).lastAutoTable.finalY + 15;
};
