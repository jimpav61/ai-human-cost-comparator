
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
  
  // Ensure we have numeric values for all cost fields, using fallbacks if any are missing
  const humanCostMonthly = typeof results.humanCostMonthly === 'number' ? results.humanCostMonthly : 15000;
  const aiCostMonthlyTotal = typeof results.aiCostMonthly?.total === 'number' ? results.aiCostMonthly.total : 229;
  const setupFee = typeof results.aiCostMonthly?.setupFee === 'number' ? results.aiCostMonthly.setupFee : 1149;
  const monthlySavings = typeof results.monthlySavings === 'number' ? results.monthlySavings : (humanCostMonthly - aiCostMonthlyTotal);
  const yearlySavings = typeof results.yearlySavings === 'number' ? results.yearlySavings : (monthlySavings * 12);
  
  console.log("Cost summary section with validated values:", {
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
