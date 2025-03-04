
import { JsPDFWithAutoTable } from '../types';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';
import type { CalculationResults } from '@/hooks/useCalculator';

export const addCostSummarySection = (
  doc: JsPDFWithAutoTable,
  currentY: number,
  results: CalculationResults
): number => {
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Cost Summary", 20, currentY);
  
  const costData = [
    ["Current Human Resources Cost", formatCurrency(results.humanCostMonthly), formatCurrency(results.humanCostMonthly * 12), "N/A"],
    ["ChatSites.ai Solution (Your Cost)", formatCurrency(results.aiCostMonthly.total), formatCurrency(results.aiCostMonthly.total * 12), formatCurrency(results.aiCostMonthly.setupFee)],
    ["Potential Savings", formatCurrency(results.monthlySavings), formatCurrency(results.yearlySavings), "N/A"]
  ];

  autoTable(doc, {
    startY: currentY + 5,
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

  return (doc as any).lastAutoTable.finalY + 15;
};
