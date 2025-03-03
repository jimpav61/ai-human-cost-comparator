import { JsPDFWithAutoTable } from '../types';

export const addAdditionalResources = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  doc.setFontSize(16);
  doc.setTextColor(40, 121, 253);
  doc.text("Additional Resources", 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Explore these resources to learn more about AI and its potential benefits for your business:", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("• AI-Powered Customer Service: Transforming the Customer Experience", 25, yPosition);
  doc.text("  [Link to Article]", 25, yPosition + 5);
  
  yPosition += 15;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("• How AI Can Automate Your Business Processes", 25, yPosition);
  doc.text("  [Link to Article]", 25, yPosition + 5);
  
  yPosition += 15;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("• The ROI of AI in Customer Support", 25, yPosition);
  doc.text("  [Link to Article]", 25, yPosition + 5);

  return yPosition + 10;
};
