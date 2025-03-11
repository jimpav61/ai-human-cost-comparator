
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
  
  // Calculate additional voice cost if there are additional minutes
  const voiceCostPerMinute = 0.12;
  const additionalVoiceCost = additionalVoiceMinutes * voiceCostPerMinute;
  
  // Create data array for the table
  let tableData = [
    ['Selected Plan:', `${tierName} (${aiType})`],
    ['Base Monthly Cost:', formatCurrency(basePrice) + '/month'],
    ['Setup and Onboarding Fee:', formatCurrency(setupFee) + ' one-time']
  ];
  
  // Add voice minutes info for non-starter tiers
  if (includedVoiceMinutes > 0) {
    tableData.push(['Included Voice Minutes:', formatNumber(includedVoiceMinutes) + ' minutes/month']);
  }
  
  // Add additional voice minutes if any
  if (additionalVoiceMinutes > 0) {
    tableData.push(
      ['Additional Voice Minutes:', formatNumber(additionalVoiceMinutes) + ' minutes/month'],
      ['Additional Voice Cost:', formatCurrency(additionalVoiceCost) + '/month']
    );
  }
  
  // Total monthly cost (base + voice)
  tableData.push(['Total Monthly Investment:', formatCurrency(basePrice + additionalVoiceCost) + '/month']);
  
  // Annual option
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
