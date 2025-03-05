
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency } from '@/utils/formatters';

export const addPlanSection = (
  doc: JsPDFWithAutoTable, 
  yPosition: number, 
  tierName: string, 
  aiType: string,
  setupFee: number,
  includedVoiceMinutes?: number,
  additionalVoiceMinutes?: number
): number => {
  let currentY = yPosition;

  // Ensure setupFee has a value and is a valid number
  const safeSetupFee = (typeof setupFee === 'number' && !isNaN(setupFee)) ? setupFee : 1149;
  
  console.log("Plan section setup fee:", safeSetupFee);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Selected Plan", 20, currentY);
  currentY += 8;
  
  doc.setFontSize(12);
  const tierKey = tierName.toLowerCase().includes('starter') ? 'starter' : 
                 tierName.toLowerCase().includes('growth') ? 'growth' : 
                 tierName.toLowerCase().includes('premium') ? 'premium' : 'growth';
  
  const voiceCapability = tierKey === 'starter' ? 'No voice capabilities' : 
                        `Includes ${includedVoiceMinutes || 0} free voice minutes per month`;
  
  doc.text(`${tierName} (${aiType})`, 20, currentY);
  currentY += 7;
  
  // Only show voice capabilities line if not starter plan or if explicitly mentioned
  if (tierKey !== 'starter' || aiType.toLowerCase().includes('voice')) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(voiceCapability, 20, currentY);
    currentY += 7;
  }
  
  // Add voice minutes details if there are any additional minutes
  if (additionalVoiceMinutes && additionalVoiceMinutes > 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const additionalVoiceCost = additionalVoiceMinutes * 0.12;
    doc.text(`Additional ${additionalVoiceMinutes} voice minutes: ${formatCurrency(additionalVoiceCost)}`, 20, currentY);
    currentY += 7;
  }
  
  // Add the one-time setup fee information
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`One-time setup fee: ${formatCurrency(safeSetupFee)}`, 20, currentY);
  
  return currentY + 12; // Extra spacing
};
