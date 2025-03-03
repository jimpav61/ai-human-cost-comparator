
import { JsPDFWithAutoTable } from '../types';
import 'jspdf-autotable';

export const addImplementationProcess = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Check if we need a new page
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  // Implementation Process - updated to reflect rapid 5-day timeline
  doc.setFontSize(14);
  doc.text("Rapid Implementation Process", 20, yPosition);
  
  doc.autoTable({
    startY: yPosition + 5,
    body: [
      ["1. Discovery & Planning (Day 1)", "Our team conducts a thorough assessment of your current systems, workflows, and customer interaction points to identify the optimal integration approach."],
      ["2. AI Model Customization (Day 2)", "We configure and fine-tune our pre-trained AI models using industry-specific data to ensure contextually appropriate responses for your business needs."],
      ["3. Integration & Testing (Day 3)", "Seamless integration with your existing systems followed by rigorous testing across various scenarios to ensure reliable performance."],
      ["4. Team Training (Day 4)", "Comprehensive training for your staff on how to monitor, manage, and maximize the AI system to ensure optimal performance."],
      ["5. Live Deployment (Day 5)", "Swift deployment with careful monitoring and real-time adjustments to ensure smooth operation from day one."]
    ],
    styles: { fontSize: 11 },
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    },
    rowPageBreak: 'auto',
  });
  
  // Get the last Y position after the table
  return (doc.lastAutoTable?.finalY || yPosition + 60) + 20;
};
