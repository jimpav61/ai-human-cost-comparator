
import { JsPDFWithAutoTable } from '../types';

export const addContactSection = (doc: JsPDFWithAutoTable, currentY: number): number => {
  // Add contact section without creating a new page if there's space
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 15;
  }

  // Final contact section with only email and phone
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Get Started with ChatSites.ai", 20, currentY);
  
  currentY += 10;
  doc.setFontSize(12);
  doc.text("Ready to implement these AI solutions?", 20, currentY);
  
  currentY += 10;
  doc.setFontSize(10);
  doc.text("• Custom AI solutions tailored to your business needs", 25, currentY);
  doc.text("• Expert implementation and support", 25, currentY + 7);
  doc.text("• Proven ROI and cost savings", 25, currentY + 14);
  
  currentY += 25;
  doc.setFontSize(12);
  doc.text("Contact Information:", 20, currentY);
  
  currentY += 10;
  doc.setFontSize(11);
  doc.text("Email: info@chatsites.ai", 25, currentY);
  doc.text("Phone: +1 480 862 0288", 25, currentY + 7);
  doc.text("Website: www.chatsites.ai", 25, currentY + 14);

  return currentY;
};
