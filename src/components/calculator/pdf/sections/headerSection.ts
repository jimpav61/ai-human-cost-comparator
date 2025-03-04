
import { JsPDFWithAutoTable } from '../types';

export const addHeaderSection = (
  doc: JsPDFWithAutoTable, 
  companyName: string, 
  contactInfo: string,
  email: string,
  phoneNumber: string | null,
  industry?: string,
  employeeCount?: number
): number => {
  // Title
  doc.setFontSize(20);
  doc.text("AI Integration Cost Analysis Report", 20, 20);
  
  // Contact Information
  doc.setFontSize(12);
  doc.text(`Generated for: ${companyName}`, 20, 35);
  doc.text(`Contact: ${contactInfo}`, 20, 42);
  doc.text(`Email: ${email}`, 20, 49);
  
  let currentY = 56;
  
  if (phoneNumber) {
    doc.text(`Phone: ${phoneNumber}`, 20, currentY);
    currentY += 7;
  }
  
  if (industry) {
    doc.text(`Industry: ${industry}`, 20, currentY);
    currentY += 7;
  }
  
  if (employeeCount) {
    doc.text(`Company Size: ${employeeCount} employees`, 20, currentY);
    currentY += 7;
  }
  
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, currentY);
  currentY += 14;
  
  return currentY;
};
