
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency } from '@/utils/formatters';
import { AI_RATES } from '@/constants/pricing';

export const addHeader = (doc: JsPDFWithAutoTable, params: any): number => {
  let currentY = 20;
  
  // Title
  doc.setFontSize(20);
  doc.text("AI Integration Cost Analysis Report", 20, currentY);
  
  // Contact Information
  currentY = 35;
  doc.setFontSize(12);
  doc.text(`Generated for: ${params.companyName}`, 20, currentY);
  
  currentY = 42;
  doc.text(`Contact: ${params.contactInfo}`, 20, currentY);
  
  currentY = 49;
  doc.text(`Email: ${params.email}`, 20, currentY);
  
  currentY = 56;
  
  if (params.phoneNumber) {
    doc.text(`Phone: ${params.phoneNumber}`, 20, currentY);
    currentY += 7;
  }
  
  if (params.industry) {
    doc.text(`Industry: ${params.industry}`, 20, currentY);
    currentY += 7;
  }
  
  if (params.employeeCount) {
    doc.text(`Company Size: ${params.employeeCount} employees`, 20, currentY);
    currentY += 7;
  }
  
  const reportDate = new Date().toLocaleDateString();
  doc.text(`Date: ${reportDate}`, 20, currentY);
  currentY += 14;

  // Add selected plan information with voice minutes details
  if (params.tierName && params.aiType) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Selected Plan", 20, currentY);
    currentY += 8;
    
    doc.setFontSize(12);
    const tierKey = params.tierName.toLowerCase().includes('starter') ? 'starter' : 
                   params.tierName.toLowerCase().includes('growth') ? 'growth' : 
                   params.tierName.toLowerCase().includes('premium') ? 'premium' : 'growth';
    
    const includedMinutes = AI_RATES.chatbot[tierKey]?.includedVoiceMinutes || 0;
    const voiceCapability = tierKey === 'starter' ? 'No voice capabilities' : 
                          `Includes ${includedMinutes} free voice minutes per month`;
    
    doc.text(`${params.tierName} (${params.aiType})`, 20, currentY);
    currentY += 7;
    
    // Only show voice capabilities line if not starter plan or if explicitly mentioned
    if (tierKey !== 'starter' || params.aiType.toLowerCase().includes('voice')) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(voiceCapability, 20, currentY);
      currentY += 7;
    }
    
    // Add the one-time setup fee information
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`One-time setup fee: ${formatCurrency(params.results.aiCostMonthly.setupFee || 0)}`, 20, currentY);
    currentY += 12; // Extra spacing
  }
  
  return currentY;
};
