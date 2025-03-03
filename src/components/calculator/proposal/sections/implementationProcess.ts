
import { JsPDFWithAutoTable } from '../types';

export const addImplementationProcess = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  // Rapid Implementation Process
  doc.setFontSize(16);
  doc.text("Rapid Implementation Process", 20, yPosition);
  yPosition += 15;
  
  // Implementation Process details
  const implementationSteps = [
    {
      title: "1. Discovery & Planning (Day 1)",
      description: "Our team conducts a thorough assessment of your current systems, workflows, and customer interaction points to identify the optimal integration approach."
    },
    {
      title: "2. AI Model Customization (Day 2)",
      description: "We configure and fine-tune our pre-trained AI models using industry-specific data to ensure contextually appropriate responses for your business needs."
    },
    {
      title: "3. Integration & Testing (Day 3)",
      description: "Seamless integration with your existing systems followed by rigorous testing across various scenarios to ensure reliable performance."
    },
    {
      title: "4. Team Training (Day 4)",
      description: "Comprehensive training for your staff on how to monitor, manage, and maximize the AI system to ensure optimal performance."
    },
    {
      title: "5. Live Deployment (Day 5)",
      description: "Swift deployment with careful monitoring and real-time adjustments to ensure smooth operation from day one."
    }
  ];
  
  implementationSteps.forEach((step, index) => {
    const stepY = yPosition + (index * 20);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(step.title, 20, stepY);
    doc.setFont(undefined, 'normal');
    
    const descLines = doc.splitTextToSize(step.description, 170);
    doc.setFontSize(10);
    doc.text(descLines, 20, stepY + 5, { align: 'left' });
  });
  
  return yPosition + (implementationSteps.length * 20) + 15;
};
