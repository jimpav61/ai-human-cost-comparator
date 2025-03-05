
import { JsPDFWithAutoTable } from '../types';
import { BusinessSuggestion } from '../../types';

export const addRecommendationsSection = (
  doc: JsPDFWithAutoTable, 
  yPosition: number,
  businessSuggestions: BusinessSuggestion[]
): number => {
  let currentY = yPosition;
  
  // Business Recommendations
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Implementation Recommendations", 20, currentY);
  
  currentY += 10;
  businessSuggestions.forEach((suggestion) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(suggestion.title, 20, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(suggestion.description, 20, currentY + 5);
    
    currentY += 15;
  });

  return currentY + 5;
};
