import { JsPDFWithAutoTable } from '../types';

export const addNextSteps = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  const sectionTitle = "Next Steps";
  const step1 = "1. Schedule a Consultation: Discuss your specific needs and how our AI solutions can address them.";
  const step2 = "2. Custom Solution Design: Our experts will design a tailored AI strategy for your business.";
  const step3 = "3. Implementation and Training: We'll guide you through the deployment process and provide comprehensive training.";

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(sectionTitle, 20, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(step1, 20, yPosition + 5);
  doc.text(step2, 20, yPosition + 15);
  doc.text(step3, 20, yPosition + 25);

  yPosition += 35;
  return yPosition;
};
