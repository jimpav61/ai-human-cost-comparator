
import { JsPDFWithAutoTable } from '../types';

export const addBranding = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Title with blue color scheme
  doc.setFontSize(20);
  doc.setTextColor(0, 121, 183); // Set blue color for title
  doc.text("ChatSites.ai Proposal", 20, yPosition);
  
  // Add a blue line under the title
  doc.setDrawColor(0, 121, 183);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition + 2, 190, yPosition + 2);
  
  return yPosition + 15;
};
