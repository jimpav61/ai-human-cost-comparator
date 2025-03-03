
import { JsPDFWithAutoTable } from '../types';

export const addAdditionalResources = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  // Additional Resources section
  doc.setFontSize(16);
  doc.text("Additional Resources", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  
  const resources = [
    {
      title: "Implementation Guide",
      description: "Detailed technical documentation for your IT team on API integration and system requirements."
    },
    {
      title: "Training Materials",
      description: "Comprehensive training package for your team, including video tutorials and user guides."
    },
    {
      title: "Case Studies",
      description: "Real-world success stories from organizations similar to yours that implemented our solutions."
    }
  ];
  
  resources.forEach((resource, index) => {
    doc.setFont(undefined, 'bold');
    doc.text(resource.title, 20, yPosition + (index * 15));
    doc.setFont(undefined, 'normal');
    doc.text(resource.description, 20, yPosition + 5 + (index * 15));
  });
  
  return yPosition + (resources.length * 15) + 20;
};
