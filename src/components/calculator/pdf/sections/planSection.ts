
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency } from '@/utils/formatters';

export const addPlanSection = (
  doc: JsPDFWithAutoTable, 
  yPosition: number, 
  tierName: string, 
  aiType: string,
  setupFee?: number,
  includedVoiceMinutes?: number,
  additionalVoiceMinutes?: number
): number => {
  let currentY = yPosition;
  
  console.log("Plan section values for PDF:", {
    tierName,
    aiType,
    setupFee,
    includedVoiceMinutes,
    additionalVoiceMinutes
  });
  
  // CRITICAL BUGFIX: Extract tier key from the exact tier name that was passed in
  // Instead of trying to parse it again which was causing the issue
  const tierKey = tierName.toLowerCase().includes('starter') ? 'starter' : 
                 tierName.toLowerCase().includes('growth') ? 'growth' : 
                 tierName.toLowerCase().includes('premium') ? 'premium' : 'growth';
  
  console.log(`Determined tierKey from tierName "${tierName}": ${tierKey}`);
  
  // Get the correct setup fee based on tier
  const tierBasedSetupFee = getTierBasedSetupFee(tierKey);
  
  // Use the proper fee (either passed value or tier-based)
  const fee = typeof setupFee === 'number' ? setupFee : tierBasedSetupFee;
  
  // Determine included voice minutes based on tier - Starter plan has 0 minutes
  const includedMinutes = tierKey === 'starter' ? 0 : 
                          (typeof includedVoiceMinutes === 'number' ? includedVoiceMinutes : 600);
  
  // CRITICAL FIX: Ensure additionalMinutes is a number, default to 0
  // For Starter plan, this should always be 0
  let additionalMinutes = 0;
  if (tierKey !== 'starter') {
    additionalMinutes = typeof additionalVoiceMinutes === 'number' ? additionalVoiceMinutes : 0;
  }
  
  console.log(`Using voice minutes: included=${includedMinutes}, additional=${additionalMinutes}`);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Selected Plan", 20, currentY);
  currentY += 8;
  
  doc.setFontSize(12);
  
  // Customize voice capability message based on tier
  const voiceCapability = tierKey === 'starter' ? 'No voice capabilities' : 
                        `Includes ${includedMinutes} free voice minutes per month`;
  
  // Add the plan name with proper AI type display
  doc.text(`${tierName} (${aiType})`, 20, currentY);
  currentY += 7;
  
  // Only show voice capabilities line if not starter plan or if explicitly mentioned
  if (tierKey !== 'starter' || aiType.toLowerCase().includes('voice')) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(voiceCapability, 20, currentY);
    currentY += 7;
  }
  
  // CRITICAL: Add voice minutes details if there are any additional minutes AND not Starter plan
  // This is the key section we need to fix for the additional voice minutes
  if (additionalMinutes > 0 && tierKey !== 'starter') {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const additionalVoiceCost = additionalMinutes * 0.12;
    doc.text(`Additional ${additionalMinutes} voice minutes: ${formatCurrency(additionalVoiceCost)}`, 20, currentY);
    currentY += 7;
  }
  
  // Add the one-time setup fee information
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`One-time setup fee: ${formatCurrency(fee)}`, 20, currentY);
  
  return currentY + 12; // Extra spacing
};

// Helper function to get tier-specific setup fees
function getTierBasedSetupFee(tierName: string): number {
  const tierKey = tierName.toLowerCase().includes('starter') ? 'starter' : 
                 tierName.toLowerCase().includes('growth') ? 'growth' : 
                 tierName.toLowerCase().includes('premium') ? 'premium' : 'growth';
                 
  // Use the exact setup fees from our pricing constants
  switch (tierKey) {
    case 'starter':
      return 249;
    case 'growth':
      return 749;
    case 'premium':
      return 1149;
    default:
      return 749; // Default to growth plan
  }
}
