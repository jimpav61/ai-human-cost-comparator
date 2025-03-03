import { JsPDFWithAutoTable } from '../types';

export const addValueProposition = (doc: JsPDFWithAutoTable, yPosition: number): number => {
  const sectionTitle = "Value Proposition";
  const valuePoints = [
    "Increased Efficiency: Automate repetitive tasks, freeing up human agents for complex issues.",
    "Cost Savings: Reduce labor costs and operational expenses through AI-driven automation.",
    "Improved Customer Satisfaction: Provide instant support and personalized experiences, leading to happier customers.",
    "Scalability: Easily handle fluctuations in demand without increasing headcount.",
    "Data-Driven Insights: Gain valuable insights into customer behavior and preferences through AI analytics."
  ];

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(sectionTitle, 20, yPosition);
  yPosition += 10;

  // Introduction
  doc.setFontSize(12);
  doc.setTextColor(70, 70, 70);
  const introductionText = "Our AI solutions deliver significant value to your business by:";
  doc.text(introductionText, 20, yPosition);
  yPosition += 8;

  // Value Points
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  valuePoints.forEach(point => {
    const wrappedText = doc.splitTextToSize(`• ${point}`, doc.internal.pageSize.getWidth() - 40);
    wrappedText.forEach(line => {
      doc.text(line, 25, yPosition);
      yPosition += 6;
    });
  });

  yPosition += 5;
  return yPosition;
};
