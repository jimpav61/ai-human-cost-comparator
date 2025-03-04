
import { JsPDFWithAutoTable } from '../types';
import type { AIPlacement } from '../../types';

export const addAIPlacementsSection = (
  doc: JsPDFWithAutoTable,
  currentY: number,
  aiPlacements: AIPlacement[]
): number => {
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("AI Integration Opportunities", 20, currentY);
  
  currentY += 10;
  
  aiPlacements.forEach((placement) => {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(placement.role, 20, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    placement.capabilities.forEach((capability, index) => {
      doc.text(`• ${capability}`, 25, currentY + 5 + (index * 5));
    });
    
    currentY += 10 + (placement.capabilities.length * 5);
  });

  return currentY;
};
