
import { JsPDFWithAutoTable } from '../types';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';

export const addCostSummary = (doc: JsPDFWithAutoTable, currentY: number, params: any): number => {
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Cost Summary", 20, currentY);
  
  const costData = [
    ["Current Human Resources Cost", formatCurrency(params.results.humanCostMonthly), formatCurrency(params.results.humanCostMonthly * 12), "N/A"],
    ["ChatSites.ai Solution (Your Cost)", formatCurrency(params.results.aiCostMonthly.total), formatCurrency(params.results.aiCostMonthly.total * 12), formatCurrency(params.results.aiCostMonthly.setupFee)],
    ["Potential Savings", formatCurrency(params.results.monthlySavings), formatCurrency(params.results.yearlySavings), "N/A"]
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
