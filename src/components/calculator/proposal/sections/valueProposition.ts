
import { JsPDFWithAutoTable } from '../types';
import 'jspdf-autotable';

export const addValueProposition = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Check if we need a new page
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.text("Value Proposition", 20, yPosition);
  
  // Benefits table
  doc.autoTable({
    startY: yPosition + 5,
    head: [["Key Benefits"]],
    body: [
      ["24/7 Customer Support Availability - Never miss another inquiry regardless of time zone or hour"],
      ["Instant Response Times - Eliminate wait times and increase customer satisfaction rates"],
      ["Consistent Service Quality - Deliver the same high standard of service with every interaction"],
      ["Multilingual Support Capabilities - Engage with your global customer base in their preferred language"],
      ["Scalable Solution - Easily accommodate growth without proportional increases in operational costs"],
      ["Valuable Customer Insights - Gain deeper understanding of customer needs through AI-powered analytics"]
    ],
    styles: { fontSize: 11 },
    theme: 'plain',
    rowPageBreak: 'auto',
    bodyStyles: { minCellHeight: 10 },
  });
  
  // Get the last Y position after the table
  return (doc.lastAutoTable?.finalY || yPosition + 60) + 20;
};
