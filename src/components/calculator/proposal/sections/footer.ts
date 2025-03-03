
import { JsPDFWithAutoTable, SectionParams } from '../types';

export const addFooter = (doc: JsPDFWithAutoTable, params: SectionParams, reportDate: string): void => {
  // Footer with contact information
  doc.setFontSize(12);
  doc.setTextColor(0, 121, 183); // Blue color for contact header
  doc.text("Contact Us:", 20, 270);
  doc.setFontSize(10);
  doc.setTextColor(46, 125, 50); // Green color for contact details
  doc.text("Email: info@chatsites.ai", 20, 277);
  doc.text("Phone: +1 480 862 0288", 20, 284);
  doc.text("Website: www.chatsites.ai", 20, 291);
};
