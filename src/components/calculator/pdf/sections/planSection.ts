
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
  additionalVoiceMinutes: number = 0
): number => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  doc.setFontSize(16);
  doc.setTextColor(255, 67, 42);
  doc.text('Investment Details', margin, startY);
  
  startY += 15;
  
  // Calculate voice costs
  const additionalVoiceCost = additionalVoiceMinutes * 0.12;
  
  const tableData = [
    ['Selected Plan:', `${tierName} (${aiType})`],
    ['Base Monthly Cost:', formatCurrency(doc.basePrice || 0) + '/month'],
    ['Setup and Onboarding Fee:', formatCurrency(setupFee) + ' one-time'],
    ['Voice Minutes Included:', formatNumber(includedVoiceMinutes) + ' minutes/month'],
    ['Additional Voice Minutes:', additionalVoiceMinutes > 0 ? formatNumber(additionalVoiceMinutes) + ' minutes/month' : 'None'],
    ['Additional Voice Cost:', additionalVoiceMinutes > 0 ? formatCurrency(additionalVoiceCost) + '/month' : 'None'],
    ['Total Monthly Investment:', formatCurrency((doc.basePrice || 0) + additionalVoiceCost) + '/month']
  ];
  
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
