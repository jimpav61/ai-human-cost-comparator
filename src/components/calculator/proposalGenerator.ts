
import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';
import type { CalculationResults } from '@/hooks/useCalculator';

interface GenerateProposalParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  results: CalculationResults;
}

export const generateProposal = (params: GenerateProposalParams) => {
  const doc = new jsPDF();
  const reportDate = new Date().toLocaleDateString();
  let yPosition = 20;

  // Branding
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text("ChatSites.ai", 20, yPosition);
  
  // Add line under the logo
  doc.setDrawColor(246, 82, 40); // brand color
  doc.setLineWidth(0.5);
  doc.line(20, yPosition + 5, 190, yPosition + 5);

  // Personalized Introduction
  yPosition += 20;
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(`Dear ${params.contactInfo},`, 20, yPosition);

  // Introduction paragraph
  yPosition += 10;
  doc.setFontSize(12);
  const introText = `Thank you for considering ChatSites.ai as your AI solution provider. Based on our analysis of ${params.companyName}'s current operations, we've developed a customized AI implementation strategy that could transform your customer service operations while delivering significant cost savings.`;
  
  const splitIntro = doc.splitTextToSize(introText, 170);
  doc.text(splitIntro, 20, yPosition);

  // Value Proposition
  yPosition += 30;
  doc.setFontSize(14);
  doc.text("Your AI Transformation Journey", 20, yPosition);
  
  doc.setFontSize(12);
  const benefits = {
    startY: yPosition + 5,
    head: [["Key Benefits"]],
    body: [
      ["24/7 Customer Support Availability"],
      ["Instant Response Times"],
      ["Consistent Service Quality"],
      ["Multilingual Support Capabilities"],
      ["Scalable Solution"]
    ],
    styles: { fontSize: 11 },
    theme: 'plain',
  } as UserOptions;

  autoTable(doc, benefits);
  yPosition = (doc as any).previousAutoTable.finalY + 20;

  // Financial Impact
  doc.setFontSize(14);
  doc.text("Financial Impact & ROI", 20, yPosition);

  // Create a professional summary of savings
  const monthlySavings = formatCurrency(params.results.monthlySavings);
  const yearlySavings = formatCurrency(params.results.yearlySavings);
  const savingsPercent = Math.abs(params.results.savingsPercentage).toFixed(1);

  const financial = {
    startY: yPosition + 5,
    head: [["Metric", "Potential Impact"]],
    body: [
      ["Monthly Cost Reduction", monthlySavings],
      ["Annual Cost Reduction", yearlySavings],
      ["Efficiency Improvement", `${savingsPercent}%`],
      ["Implementation Timeline", "2-4 weeks"]
    ],
    styles: { fontSize: 11 },
  } as UserOptions;

  autoTable(doc, financial);
  yPosition = (doc as any).previousAutoTable.finalY + 20;

  // Implementation Process
  doc.setFontSize(14);
  doc.text("Implementation Process", 20, yPosition);

  const implementation = {
    startY: yPosition + 5,
    body: [
      ["1. Initial Setup & Integration (Week 1)"],
      ["2. AI Model Training & Customization (Week 2)"],
      ["3. Team Training & Testing (Week 3)"],
      ["4. Launch & Optimization (Week 4)"]
    ],
    styles: { fontSize: 11 },
    theme: 'plain',
  } as UserOptions;

  autoTable(doc, implementation);
  yPosition = (doc as any).previousAutoTable.finalY + 20;

  // Next Steps
  doc.setFontSize(14);
  doc.text("Next Steps", 20, yPosition);

  doc.setFontSize(12);
  const nextStepsText = "Let's schedule a detailed walkthrough of our solution and discuss how we can best implement it for your specific needs. Our team is ready to answer any questions and provide additional information about:";
  const splitNextSteps = doc.splitTextToSize(nextStepsText, 170);
  doc.text(splitNextSteps, 20, yPosition + 10);

  const nextSteps = {
    startY: yPosition + 25,
    body: [
      ["• Custom implementation timeline"],
      ["• Training and onboarding process"],
      ["• Integration with existing systems"],
      ["• Performance monitoring and optimization"]
    ],
    styles: { fontSize: 11 },
    theme: 'plain',
  } as UserOptions;

  autoTable(doc, nextSteps);

  // Contact Information
  doc.addPage();
  yPosition = 20;
  doc.setFontSize(14);
  doc.text("Get Started Today", 20, yPosition);

  doc.setFontSize(12);
  doc.text("Contact us to begin your AI transformation journey:", 20, yPosition + 15);
  
  doc.setTextColor(246, 82, 40); // brand color
  doc.text("Email: sales@chatsites.ai", 20, yPosition + 30);
  doc.text("Phone: (555) 123-4567", 20, yPosition + 40);
  doc.text("Website: www.chatsites.ai", 20, yPosition + 50);

  // Footer with personalization
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Proposal prepared exclusively for ${params.companyName}`, 20, 280);
  doc.text(`Generated on ${reportDate}`, 20, 287);

  return doc;
};
