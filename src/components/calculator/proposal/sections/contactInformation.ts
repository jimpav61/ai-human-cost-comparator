
import { JsPDFWithAutoTable } from '../types';

export const addContactInformation = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Contact Information
  doc.setFontSize(16);
  doc.text("Your ChatSites.ai Team", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  
  const contactInfo = [
    { name: "Sales Team", phone: "+1 480-862-0288", email: "sales@chatsites.ai" },
    { name: "Technical Support", phone: "+1 480-862-0289", email: "support@chatsites.ai" },
    { name: "Customer Success", phone: "+1 480-862-0290", email: "success@chatsites.ai" }
  ];
  
  contactInfo.forEach((contact, index) => {
    doc.setFont(undefined, 'bold');
    doc.text(contact.name, 20, yPosition + (index * 15));
    doc.setFont(undefined, 'normal');
    doc.text(`Phone: ${contact.phone}`, 20, yPosition + 5 + (index * 15));
    doc.text(`Email: ${contact.email}`, 20, yPosition + 10 + (index * 15));
  });
  
  return yPosition + (contactInfo.length * 15) + 20;
};
