
import { JsPDFWithAutoTable } from '../types';

export const addBranding = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Branding
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text("ChatSites.ai", 20, yPosition);
  
  // Add line under the logo
  doc.setDrawColor(246, 82, 40); // brand color
  doc.setLineWidth(0.5);
  doc.line(20, yPosition + 5, 190, yPosition + 5);
  
  return yPosition + 5;
};
