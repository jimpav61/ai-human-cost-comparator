
import { JsPDFWithAutoTable } from '../types';

export const addContactInformation = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Get Started Today
  doc.setFontSize(14);
  doc.text("Get Started Today", 20, yPosition);

  doc.setFontSize(12);
  const getStartedText = "Contact our dedicated implementation team to begin your AI transformation journey. We're ready to help you revolutionize your customer service operations and achieve significant cost savings within just 5 business days.";
  const splitGetStarted = doc.splitTextToSize(getStartedText, 170);
  doc.text(splitGetStarted, 20, yPosition + 10);
  
  // Contact Information with only email, phone, and website
  yPosition += splitGetStarted.length * 7 + 20;
  doc.setTextColor(246, 82, 40); // brand color
  doc.setFontSize(12);
  doc.text("Contact Us:", 20, yPosition);
  doc.text("Email: info@chatsites.ai", 20, yPosition + 8);
  doc.text("Phone: +1 480 862 0288", 20, yPosition + 16);
  doc.text("Website: www.chatsites.ai", 20, yPosition + 24);
  
  return yPosition + 24;
};
