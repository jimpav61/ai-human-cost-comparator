
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';

export const addPlanSection = (
  doc: JsPDFWithAutoTable,
  startY: number,
  tierName: string,
  aiType: string,
  setupFee: number = 0,
  includedVoiceMinutes: number = 0,
  additionalVoiceMinutes: number = 0,
  basePrice: number = 0
): number => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  doc.setFontSize(16);
  doc.setTextColor(255, 67, 42);
  doc.text('Investment Details', margin, startY);
  
  startY += 15;
  
  // Calculate voice costs - ensure we have a valid number and it's only calculated for non-starter tiers
  const voiceCostPerMinute = 0.12;
  const additionalVoiceCost = additionalVoiceMinutes > 0 ? additionalVoiceMinutes * voiceCostPerMinute : 0;
  
  // Create a data array for the table - explicitly handle zero vs positive minutes
  let tableData = [
    ['Selected Plan:', `${tierName} (${aiType})`],
    ['Base Monthly Cost:', formatCurrency(basePrice) + '/month'],
    ['Setup and Onboarding Fee:', formatCurrency(setupFee) + ' one-time']
  ];
  
  // Always add included voice minutes for non-starter tiers
  if (includedVoiceMinutes > 0) {
    tableData.push(['Included Voice Minutes:', formatNumber(includedVoiceMinutes) + ' minutes/month']);
  }
  
  // Explicitly handle additional minutes display
  if (additionalVoiceMinutes > 0) {
    tableData.push(['Additional Voice Minutes:', formatNumber(additionalVoiceMinutes) + ' minutes/month']);
    tableData.push(['Additional Voice Cost:', formatCurrency(additionalVoiceCost) + '/month']);
  } else if (includedVoiceMinutes > 0) {
    // Only show "None requested" for plans that support voice but don't have additional minutes
    tableData.push(['Additional Voice Minutes:', 'None requested']);
  }
  
  // Always show total monthly cost
  tableData.push(['Total Monthly Investment:', formatCurrency(basePrice + additionalVoiceCost) + '/month']);
  
  // Add annual option with 2 months free
  tableData.push(['Annual Investment:', formatCurrency((basePrice + additionalVoiceCost) * 10) + '/year (2 months free with annual plan)']);
  
  autoTable(doc, {
    startY,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 11,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 'auto' }
    },
    body: tableData
  });
  
  const finalY = (doc.lastAutoTable?.finalY || startY) + 15;
  return finalY;
};
