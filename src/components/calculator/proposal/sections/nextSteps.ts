
import { JsPDFWithAutoTable } from '../types';

export const addNextSteps = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Strategic Next Steps
  doc.setFontSize(16);
  doc.text("Strategic Next Steps", 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  const nextStepsText = "To ensure a successful AI implementation for your organization, we recommend the following structured approach:";
  doc.text(nextStepsText, 20, yPosition);
  yPosition += 10;
  
  const nextSteps = [
    {
      title: "1. Executive Strategy Session",
      description: "Schedule a 60-minute executive briefing where we'll walk through the comprehensive proposal and address any strategic questions."
    },
    {
      title: "2. Technical Discovery Meeting",
      description: "Arrange a brief session with your IT team to discuss integration details and security protocols."
    },
    {
      title: "3. Same-Day Implementation Plan",
      description: "Receive a tailored implementation roadmap with specific milestones and responsibilities."
    },
    {
      title: "4. Rapid Deployment",
      description: "Start with immediate implementation to demonstrate value from day one."
    },
    {
      title: "5. Continuous Optimization",
      description: "Our team provides ongoing support to ensure maximum ROI from your AI investment."
    }
  ];
  
  nextSteps.forEach((step, index) => {
    const stepY = yPosition + (index * 15);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(step.title, 20, stepY);
    doc.setFont(undefined, 'normal');
    
    doc.setFontSize(10);
    doc.text(step.description, 20, stepY + 5);
  });
  
  return yPosition + (nextSteps.length * 15) + 20;
};
