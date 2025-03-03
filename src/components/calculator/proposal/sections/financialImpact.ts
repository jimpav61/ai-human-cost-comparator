
import { JsPDFWithAutoTable, SectionParams } from '../types';
import { formatCurrency } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';

export const addFinancialImpact = (doc: JsPDFWithAutoTable, yPosition: number, params: SectionParams): number => {
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Financial Impact & ROI Analysis
  doc.setFontSize(16);
  doc.setTextColor(0, 121, 183); // Blue color for section header
  doc.text("Financial Impact & ROI Analysis", 20, yPosition);
  yPosition += 10;

  // Format the percentage to ensure it's a proper number
  const efficiencyImprovement = params.results?.savingsPercentage > 0 
    ? `${params.results.savingsPercentage.toFixed(1)}%` 
    : '97.4%';
    
  // Format currency values
  const monthlySavings = formatCurrency(params.results?.monthlySavings || 3701);
  const yearlySavings = formatCurrency(params.results?.yearlySavings || 44412);
  const setupFee = formatCurrency(params.results?.aiCostMonthly.setupFee || 249);

  // Create ROI table with dynamically calculated values and green headers
  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Potential Impact']],
    body: [
      ['Monthly Cost Reduction', monthlySavings],
      ['Annual Cost Reduction', yearlySavings],
      ['Efficiency Improvement', efficiencyImprovement],
      ['One-Time Setup Fee', setupFee],
      ['Implementation Timeline', '5 business days or less'],
      ['ROI Timeline', '3 to 6 months'],
      ['5-Year Projected Savings', formatCurrency(params.results?.yearlySavings * 5 || 222060)]
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [46, 125, 50], // Green color for table header
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      cellPadding: 5,
      fontSize: 10
    },
    columnStyles: {
      0: { fontStyle: 'bold' }
    }
  });
  
  yPosition = (doc.lastAutoTable?.finalY || yPosition) + 15;
  
  // Cost Comparison
  doc.setFontSize(14);
  doc.setTextColor(46, 125, 50); // Green color for sub-section header
  doc.text("Cost Comparison", 20, yPosition);
  yPosition += 10;
  
  // Format human staff costs
  const humanMonthly = formatCurrency(params.results?.humanCostMonthly || 3800);
  const humanAnnual = formatCurrency((params.results?.humanCostMonthly || 3800) * 12);
  const aiMonthly = formatCurrency(params.results?.aiCostMonthly.total || 99);
  const aiAnnual = formatCurrency((params.results?.aiCostMonthly.total || 99) * 12);
  
  // Create cost comparison table with blue headers
  autoTable(doc, {
    startY: yPosition,
    head: [['Solution', 'Monthly Cost', 'Annual Cost', 'One-Time Setup Fee']],
    body: [
      ['Current Human Staff', humanMonthly, humanAnnual, 'N/A'],
      ['ChatSites.ai Solution (Your Cost)', aiMonthly, aiAnnual, setupFee]
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [0, 121, 183], // Blue color for table header
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      cellPadding: 5,
      fontSize: 10
    },
    columnStyles: {
      0: { fontStyle: 'bold' }
    }
  });
  
  return (doc.lastAutoTable?.finalY || yPosition) + 20;
};
