
import { JsPDFWithAutoTable } from '../types';

export const addBranding = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Title with brand color scheme
  doc.setFontSize(20);
  doc.setTextColor(246, 82, 40); // Set brand color for title (f65228)
  doc.text("ChatSites.ai Proposal", 20, yPosition);
  
  // Add a brand-colored line under the title
  doc.setDrawColor(246, 82, 40);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition + 2, 190, yPosition + 2);
  
  return yPosition + 15;
};
