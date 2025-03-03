
import { JsPDFWithAutoTable } from '../types';

export const addValueProposition = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Value Proposition
  doc.setFontSize(16);
  doc.text("Value Proposition", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(14);
  doc.text("Key Benefits", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  
  // Benefits list
  const benefits = [
    "24/7 Customer Support - Provide round-the-clock assistance without additional staffing costs",
    "Improved Response Time - Instant responses to customer inquiries",
    "Consistent Quality - Every interaction follows best practices and company standards",
    "Multilingual Support - Communicate with customers in their preferred language",
    "Valuable Customer Insights - Gain deeper understanding of customer needs through AI-powered analytics"
  ];
  
  benefits.forEach((benefit, index) => {
    doc.text(benefit, 20, yPosition + (index * 7));
  });
  
  return yPosition + (benefits.length * 7) + 20;
};
