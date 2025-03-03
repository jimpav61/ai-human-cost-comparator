
import { JsPDFWithAutoTable } from '../types';

export const addBranding = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("ChatSites.ai Proposal", 20, yPosition);
  
  return yPosition + 15;
};
