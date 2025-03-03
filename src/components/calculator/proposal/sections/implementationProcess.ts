import { JsPDFWithAutoTable } from '../types';

export const addImplementationProcess = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Implementation Process", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.text("Our proven implementation process ensures a smooth transition:", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("1. Initial Consultation: Understand your specific needs and goals.", 25, yPosition);
  doc.text("2. Solution Design: Customize the AI solution to fit your unique requirements.", 25, yPosition + 7);
  doc.text("3. Implementation: Integrate the AI seamlessly into your existing systems.", 25, yPosition + 14);
  doc.text("4. Training: Provide comprehensive training for your team.", 25, yPosition + 21);
  doc.text("5. Ongoing Support: Offer continuous support and optimization.", 25, yPosition + 28);
  
  yPosition += 35;
  return yPosition;
};
