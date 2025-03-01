
import { JsPDFWithAutoTable } from '../types';
import autoTable from 'jspdf-autotable';

export const addNextSteps = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Check if we need a new page
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  // Detailed Next Steps
  doc.setFontSize(14);
  doc.text("Strategic Next Steps", 20, yPosition);

  doc.setFontSize(12);
  const nextStepsText = "To ensure a successful AI implementation for your organization, we recommend the following structured approach:";
  const splitNextSteps = doc.splitTextToSize(nextStepsText, 170);
  doc.text(splitNextSteps, 20, yPosition + 10);

  autoTable(doc, {
    startY: yPosition + splitNextSteps.length * 7 + 15,
    body: [
      ["1. Executive Strategy Session", "Schedule a 60-minute executive briefing where we'll walk through the comprehensive proposal and address any strategic questions."],
      ["2. Technical Discovery Meeting", "Arrange a brief session with your IT team to discuss integration details and security protocols."],
      ["3. Same-Day Implementation Plan", "Receive a tailored implementation roadmap with specific milestones and responsibilities."],
      ["4. Rapid Deployment", "Start with immediate implementation to demonstrate value from day one."],
      ["5. Continuous Optimization", "Our team provides ongoing support to ensure maximum ROI from your AI investment."]
    ],
    styles: { fontSize: 11 },
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    },
    rowPageBreak: 'auto',
  });
  
  return (doc.lastAutoTable?.finalY || yPosition + 60) + 20;
};
