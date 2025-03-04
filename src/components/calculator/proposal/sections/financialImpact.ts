
import { JsPDFWithAutoTable, SectionParams } from '../types';
import { formatCurrency } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';
import { AI_RATES } from '@/constants/pricing';

export const addFinancialImpact = (doc: JsPDFWithAutoTable, yPosition: number, params: SectionParams): number => {
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Financial Impact & ROI Analysis
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header (f65228)
  doc.text("Financial Impact & ROI Analysis", 20, yPosition);
  yPosition += 10;

  // Format the percentage to ensure it's a proper number
  const efficiencyImprovement = params.results?.savingsPercentage > 0 
    ? `${params.results.savingsPercentage.toFixed(1)}%` 
    : '97.4%';
    
  // Format currency values
  const monthlySavings = formatCurrency(params.results?.monthlySavings || 3701);
  const yearlySavings = formatCurrency(params.results?.yearlySavings || 44412);
  
  // Get setup fee from results or determine from tier
  let setupFee = 0;
  if (params.results?.aiCostMonthly?.setupFee !== undefined) {
    setupFee = params.results.aiCostMonthly.setupFee;
  } else if (params.results?.tierKey) {
    // Get from tier key
    setupFee = AI_RATES.chatbot[params.results.tierKey]?.setupFee || 249;
  } else if (params.tierName) {
    // Derive from tier name
    const tierLower = params.tierName.toLowerCase();
    if (tierLower.includes('premium')) {
      setupFee = AI_RATES.chatbot.premium.setupFee;
    } else if (tierLower.includes('growth')) {
      setupFee = AI_RATES.chatbot.growth.setupFee;
    } else {
      setupFee = AI_RATES.chatbot.starter.setupFee;
    }
  }
  
  const setupFeeFormatted = formatCurrency(setupFee);

  // Create ROI table with dynamically calculated values and brand headers
  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Potential Impact']],
    body: [
      ['Monthly Cost Reduction', monthlySavings],
      ['Annual Cost Reduction', yearlySavings],
      ['Efficiency Improvement', efficiencyImprovement],
      ['One-Time Setup Fee', setupFeeFormatted],
      ['Implementation Timeline', '5 business days or less'],
      ['ROI Timeline', '3 to 6 months'],
      ['5-Year Projected Savings', formatCurrency(params.results?.yearlySavings * 5 || 222060)]
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [246, 82, 40], // Brand color for table header (f65228)
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
  doc.setTextColor(246, 82, 40); // Brand color for sub-section header (f65228)
  doc.text("Cost Comparison", 20, yPosition);
  yPosition += 10;
  
  // Format human staff costs
  const humanMonthly = formatCurrency(params.results?.humanCostMonthly || 3800);
  const humanAnnual = formatCurrency((params.results?.humanCostMonthly || 3800) * 12);
  
  // Get AI monthly cost based on the selected tier
  let aiMonthly = 0;
  if (params.results?.aiCostMonthly?.total !== undefined) {
    aiMonthly = params.results.aiCostMonthly.total;
  } else if (params.results?.tierKey) {
    // Get base price from tier
    aiMonthly = AI_RATES.chatbot[params.results.tierKey]?.base || 99;
  } else if (params.tierName) {
    // Derive from tier name
    const tierLower = params.tierName.toLowerCase();
    if (tierLower.includes('premium')) {
      aiMonthly = AI_RATES.chatbot.premium.base;
    } else if (tierLower.includes('growth')) {
      aiMonthly = AI_RATES.chatbot.growth.base;
    } else {
      aiMonthly = AI_RATES.chatbot.starter.base;
    }
  }
  
  const aiMonthlyFormatted = formatCurrency(aiMonthly);
  const aiAnnual = formatCurrency(aiMonthly * 12);
  
  // Create cost comparison table with brand headers
  autoTable(doc, {
    startY: yPosition,
    head: [['Solution', 'Monthly Cost', 'Annual Cost', 'One-Time Setup Fee']],
    body: [
      ['Current Human Staff', humanMonthly, humanAnnual, 'N/A'],
      ['ChatSites.ai Solution (Your Cost)', aiMonthlyFormatted, aiAnnual, setupFeeFormatted]
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [246, 82, 40], // Brand color for table header (f65228)
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
