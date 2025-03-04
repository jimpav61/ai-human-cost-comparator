
import { JsPDFWithAutoTable } from '../types';
import { AI_RATES } from '@/constants/pricing';

export const addPlanSection = (
  doc: JsPDFWithAutoTable, 
  currentY: number,
  tierName?: string,
  aiType?: string,
  setupFee?: number
): number => {
  if (!tierName || !aiType) {
    return currentY;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Selected Plan", 20, currentY);
  currentY += 8;
  
  doc.setFontSize(12);
  const tierKey = tierName.toLowerCase().includes('starter') ? 'starter' : 
                 tierName.toLowerCase().includes('growth') ? 'growth' : 
                 tierName.toLowerCase().includes('premium') ? 'premium' : 'growth';
  
  const includedMinutes = tierKey === 'starter' ? 0 : 600;
  const voiceCapability = tierKey === 'starter' ? 'No voice capabilities' : 
                        `Includes ${includedMinutes} free voice minutes per month`;
  
  doc.text(`${tierName} (${aiType})`, 20, currentY);
  currentY += 7;
  
  // Only show voice capabilities line if not starter plan or if explicitly mentioned
  if (tierKey !== 'starter' || aiType.toLowerCase().includes('voice')) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(voiceCapability, 20, currentY);
    currentY += 7;
  }
  
  // Add the one-time setup fee information
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`One-time setup fee: $${(setupFee || 0).toFixed(2)}`, 20, currentY);
  currentY += 12; // Extra spacing
  
  return currentY;
};
