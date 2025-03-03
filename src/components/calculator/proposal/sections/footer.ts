
import { JsPDFWithAutoTable, SectionParams } from '../types';

export const addFooter = (doc: JsPDFWithAutoTable, params: SectionParams, reportDate: string): void => {
  // Footer with contact information
  doc.setFontSize(12);
  doc.setTextColor(246, 82, 40); // Brand color for contact header
  doc.text("Contact Us:", 20, 270);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Keep contact details black
  doc.text("Email: info@chatsites.ai", 20, 277);
  doc.text("Phone: +1 480 862 0288", 20, 284);
  doc.text("Website: www.chatsites.ai", 20, 291);
};
