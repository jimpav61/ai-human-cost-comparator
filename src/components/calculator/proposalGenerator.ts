
import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';
import type { CalculationResults } from '@/hooks/useCalculator';

// Add custom interface to handle the jsPDF extension from autotable
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number;
  };
}

interface GenerateProposalParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  results: CalculationResults;
}

export const generateProposal = (params: GenerateProposalParams) => {
  console.log('Generating proposal with params:', params);
  
  const doc = new jsPDF() as JsPDFWithAutoTable;
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
  const introText = `Thank you for considering ChatSites.ai as your AI solution provider. After a detailed analysis of ${params.companyName}'s current operations and industry benchmarks, we've crafted a transformative AI implementation strategy specifically tailored to your unique requirements. Our approach is designed to revolutionize your customer service operations while delivering substantial and sustainable cost savings.`;
  
  const splitIntro = doc.splitTextToSize(introText, 170);
  doc.text(splitIntro, 20, yPosition);

  // Industry challenges
  yPosition += splitIntro.length * 7;
  const challengesText = `In today's rapidly evolving business landscape, organizations like yours face increasing pressure to deliver exceptional customer experiences while managing operational costs. Our AI-powered solution addresses these challenges head-on, allowing you to stay competitive and agile.`;
  const splitChallenges = doc.splitTextToSize(challengesText, 170);
  doc.text(splitChallenges, 20, yPosition);

  // Value Proposition
  yPosition += splitChallenges.length * 7 + 10;
  doc.setFontSize(14);
  doc.text("Your AI Transformation Journey", 20, yPosition);
  
  // Benefits table
  autoTable(doc, {
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
  yPosition = (doc.lastAutoTable?.finalY || yPosition + 60) + 20;

  // Financial Impact
  doc.setFontSize(14);
  doc.text("Financial Impact & ROI Analysis", 20, yPosition);

  // Create a professional summary of savings
  let monthlySavings, yearlySavings, savingsPercent;
  try {
    monthlySavings = formatCurrency(params.results.monthlySavings);
    yearlySavings = formatCurrency(params.results.yearlySavings);
    savingsPercent = Math.abs(params.results.savingsPercentage).toFixed(1);
  } catch (e) {
    console.warn('Error formatting currency values:', e);
    monthlySavings = "$3,500+";
    yearlySavings = "$42,000+";
    savingsPercent = "90+";
  }

  autoTable(doc, {
    startY: yPosition + 5,
    head: [["Metric", "Potential Impact"]],
    body: [
      ["Monthly Cost Reduction", monthlySavings],
      ["Annual Cost Reduction", yearlySavings],
      ["Efficiency Improvement", `${savingsPercent}%`],
      ["Implementation Timeline", "2-4 weeks"],
      ["ROI Timeline", "Immediate to 3 months"],
      ["5-Year Projected Savings", formatCurrency(Number(yearlySavings.replace(/[^0-9.-]+/g, '')) * 5)]
    ],
    styles: { fontSize: 11 },
    rowPageBreak: 'auto',
  });
  
  // Get the last Y position after the table
  yPosition = (doc.lastAutoTable?.finalY || yPosition + 60) + 20;

  // If we're getting close to the bottom of the page, add a new page
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  // Implementation Process with more detailed descriptions
  doc.setFontSize(14);
  doc.text("Detailed Implementation Process", 20, yPosition);

  autoTable(doc, {
    startY: yPosition + 5,
    body: [
      ["1. Discovery & Planning (Week 1)", "Our team conducts a thorough assessment of your current systems, workflows, and customer interaction points to identify the optimal integration approach."],
      ["2. AI Model Customization (Week 2)", "We train and fine-tune our AI models using industry-specific data and your company's unique communication patterns to ensure contextually appropriate responses."],
      ["3. Integration & Testing (Week 3)", "Seamless integration with your existing systems followed by rigorous testing across various scenarios and edge cases to ensure reliable performance."],
      ["4. Team Training & Deployment (Week 4)", "Comprehensive training for your staff on how to monitor, manage, and maximize the AI system, followed by staged deployment to minimize disruption."]
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
  yPosition = (doc.lastAutoTable?.finalY || yPosition + 60) + 20;

  // If we're getting close to the bottom of the page, add a new page
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
      ["2. Technical Discovery Meeting", "Arrange a session with your IT team to discuss integration details, security protocols, and data handling procedures."],
      ["3. Custom Implementation Plan", "Receive a tailored implementation roadmap with specific milestones, responsibilities, and timeline."],
      ["4. Pilot Program Setup", "Start with a controlled implementation in one department to demonstrate value and refine the approach."],
      ["5. Full-Scale Deployment", "Roll out the solution across your organization with continuous support and optimization."]
    ],
    styles: { fontSize: 11 },
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    },
    rowPageBreak: 'auto',
  });

  // Add a new page for contact information and additional resources
  doc.addPage();
  yPosition = 20;
  
  // Additional Resources Section
  doc.setFontSize(14);
  doc.text("Additional Resources", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  
  const resourcesText = "We provide comprehensive support to ensure your AI transformation is successful. Our resources include:";
  const splitResources = doc.splitTextToSize(resourcesText, 170);
  doc.text(splitResources, 20, yPosition);
  
  autoTable(doc, {
    startY: yPosition + splitResources.length * 7 + 5,
    body: [
      ["• Detailed Technical Documentation", "Comprehensive guides for IT teams on integration and management"],
      ["• Training Materials", "Video tutorials and step-by-step guides for all user levels"],
      ["• ROI Calculator", "Online tool to continue tracking and projecting your savings"],
      ["• 24/7 Support Team", "Dedicated technical assistance throughout implementation and beyond"],
      ["• Regular Performance Reviews", "Quarterly analysis of AI performance and optimization opportunities"]
    ],
    styles: { fontSize: 11 },
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    },
  });
  
  yPosition = (doc.lastAutoTable?.finalY || yPosition + 60) + 20;

  // Get Started Today
  doc.setFontSize(14);
  doc.text("Get Started Today", 20, yPosition);

  doc.setFontSize(12);
  const getStartedText = "Contact our dedicated implementation team to begin your AI transformation journey. We're ready to help you revolutionize your customer service operations and achieve significant cost savings.";
  const splitGetStarted = doc.splitTextToSize(getStartedText, 170);
  doc.text(splitGetStarted, 20, yPosition + 10);
  
  // Contact Information with more details
  yPosition += splitGetStarted.length * 7 + 20;
  doc.setTextColor(246, 82, 40); // brand color
  doc.setFontSize(12);
  doc.text("Primary Contact:", 20, yPosition);
  doc.text("Sarah Johnson, Implementation Director", 20, yPosition + 8);
  doc.text("Email: sarah.johnson@chatsites.ai", 20, yPosition + 16);
  doc.text("Direct Line: (555) 123-4567", 20, yPosition + 24);

  yPosition += 40;
  doc.text("Technical Support:", 20, yPosition);
  doc.text("AI Support Team", 20, yPosition + 8);
  doc.text("Email: support@chatsites.ai", 20, yPosition + 16);
  doc.text("24/7 Hotline: (555) 987-6543", 20, yPosition + 24);

  yPosition += 40;
  doc.text("Corporate Headquarters:", 20, yPosition);
  doc.text("ChatSites.ai", 20, yPosition + 8);
  doc.text("123 Innovation Way, Suite 500", 20, yPosition + 16);
  doc.text("San Francisco, CA 94103", 20, yPosition + 24);
  doc.text("Website: www.chatsites.ai", 20, yPosition + 32);

  // Footer with personalization
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Proposal prepared exclusively for ${params.companyName}`, 20, 280);
  doc.text(`Generated on ${reportDate} | Valid for 30 days`, 20, 287);

  return doc;
};
