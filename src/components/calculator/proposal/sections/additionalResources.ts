
import { JsPDFWithAutoTable } from '../types';
import 'jspdf-autotable';

export const addAdditionalResources = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Additional Resources Section
  doc.setFontSize(14);
  doc.text("Additional Resources", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  
  const resourcesText = "We provide comprehensive support to ensure your AI transformation is successful. Our resources include:";
  const splitResources = doc.splitTextToSize(resourcesText, 170);
  doc.text(splitResources, 20, yPosition);
  
  doc.autoTable({
    startY: yPosition + splitResources.length * 7 + 5,
    body: [
      ["• Detailed Technical Documentation", "Comprehensive guides for IT teams on integration and management"],
      ["• Training Materials", "Video tutorials and step-by-step guides for all user levels"],
      ["• ROI Calculator", "Online tool to continue tracking and projecting your savings"],
      ["• 24/7 Support Team", "Dedicated technical assistance throughout implementation and beyond"],
      ["• Regular Performance Reviews", "Monthly analysis of AI performance and optimization opportunities"]
    ],
    styles: { fontSize: 11 },
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    },
  });
  
  return (doc.lastAutoTable?.finalY || yPosition + 60) + 20;
};
