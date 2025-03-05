
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
  const reportDate = new Date().toLocaleDateString();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(246, 82, 40); // Red color (f65228)
  doc.text("AI Integration Cost Analysis Report", 20, 20);
  
  // Add a brand-colored line under the title
  doc.setDrawColor(246, 82, 40);
  doc.setLineWidth(0.5);
  doc.line(20, 22, 190, 22);
  
  // Contact Information
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black color for contact information
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
  
  doc.text(`Date: ${reportDate}`, 20, currentY);
  
  return currentY + 14;
};
