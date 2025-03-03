
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { CalculationResults } from '@/hooks/useCalculator';
import { PricingDetail } from './types';

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
  industry?: string;
  employeeCount?: number;
  results: CalculationResults;
  tierName?: string;
  aiType?: string;
  pricingDetails?: PricingDetail[];
}

export const generateProposal = (params: GenerateProposalParams) => {
  console.log('Generating proposal with params:', params);
  
  const doc = new jsPDF() as JsPDFWithAutoTable;
  const reportDate = new Date().toLocaleDateString();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("ChatSites.ai Proposal", 20, yPosition);
  
  yPosition += 15;

  // Personalized Introduction
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(`Dear ${params.contactInfo},`, 20, yPosition);

  // Organization info
  yPosition += 10;
  doc.setFontSize(12);
  doc.text(`Organization: ${params.companyName}`, 20, yPosition);
  yPosition += 7;
  
  if (params.industry) {
    doc.text(`Industry: ${params.industry}`, 20, yPosition);
    yPosition += 7;
  }
  
  if (params.employeeCount) {
    doc.text(`Company Size: ${params.employeeCount} employees`, 20, yPosition);
    yPosition += 7;
  }
  
  // Introduction paragraph - customized with industry if available
  yPosition += 5;
  const industrySpecificPhrase = params.industry 
    ? `in the ${params.industry} industry` 
    : "in your industry";
    
  const introText = `Thank you for considering ChatSites.ai as your AI solution provider. Based on our analysis of your requirements, we've prepared the following proposal tailored for organizations ${industrySpecificPhrase}.`;
  
  const splitIntro = doc.splitTextToSize(introText, 170);
  doc.text(splitIntro, 20, yPosition);
  
  yPosition += splitIntro.length * 7 + 10;

  // Recommended Solution
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Recommended Solution", 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  
  // Get tier name and AI type
  const tierName = params.tierName || 'Growth Plan';
  const aiType = params.aiType || 'Chatbot & Voice AI';
  
  // Plan details
  let planText = `Based on your specific needs, we recommend our ${tierName}. This provides optimal functionality while maximizing your return on investment. The plan includes ${params.results.aiCostMonthly.setupFee > 500 ? '600' : '0'} free voice minutes per month.`;
  
  const splitPlanText = doc.splitTextToSize(planText, 170);
  doc.text(splitPlanText, 20, yPosition);
  
  yPosition += splitPlanText.length * 7 + 15;

  // Your ChatSites.ai Investment
  doc.setFontSize(16);
  doc.text("Your ChatSites.ai Investment", 20, yPosition);
  yPosition += 10;

  // Create pricing table exactly as shown in the image
  autoTable(doc, {
    startY: yPosition,
    head: [['Pricing Component', 'Details', 'Cost']],
    body: [
      ['Monthly Base Fee', params.tierName || 'Growth Plan (Text & Basic Voice)', formatCurrency(params.results.aiCostMonthly.chatbot)],
      ['One-time Setup/Onboarding Fee', 'Non-refundable', formatCurrency(params.results.aiCostMonthly.setupFee)],
      ['Annual Plan Option', 'Includes 2 months FREE!', formatCurrency(params.results.annualPlan)],
      ['Estimated Monthly Savings', 'vs. current operations', formatCurrency(params.results.monthlySavings)],
      ['Projected Annual Savings', 'First year', formatCurrency(params.results.yearlySavings)]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [0, 179, 136],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    styles: {
      cellPadding: 5,
      fontSize: 10,
      lineWidth: 0.1,
      lineColor: [220, 220, 220]
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'right' }
    }
  });

  yPosition = (doc.lastAutoTable?.finalY || yPosition) + 20;
  
  // Value Proposition
  doc.setFontSize(16);
  doc.text("Value Proposition", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(14);
  doc.text("Key Benefits", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  
  // Benefits list
  const benefits = [
    "24/7 Customer Support - Provide round-the-clock assistance without additional staffing costs",
    "Improved Response Time - Instant responses to customer inquiries",
    "Consistent Quality - Every interaction follows best practices and company standards",
    "Multilingual Support - Communicate with customers in their preferred language",
    "Valuable Customer Insights - Gain deeper understanding of customer needs through AI-powered analytics"
  ];
  
  benefits.forEach((benefit, index) => {
    doc.text(benefit, 20, yPosition + (index * 7));
  });
  
  yPosition += (benefits.length * 7) + 20;
  
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Financial Impact & ROI Analysis
  doc.setFontSize(16);
  doc.text("Financial Impact & ROI Analysis", 20, yPosition);
  yPosition += 10;

  // Create ROI table as shown in the image
  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Potential Impact']],
    body: [
      ['Monthly Cost Reduction', formatCurrency(params.results.monthlySavings)],
      ['Annual Cost Reduction', formatCurrency(params.results.yearlySavings)],
      ['Efficiency Improvement', `${Math.round(params.results.savingsPercentage)}%`],
      ['One-Time Setup Fee', formatCurrency(params.results.aiCostMonthly.setupFee)],
      ['Implementation Timeline', '5 business days or less'],
      ['ROI Timeline', '3 to 6 months'],
      ['5-Year Projected Savings', formatCurrency(params.results.yearlySavings * 5)]
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [0, 121, 183],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      cellPadding: 5,
      fontSize: 10
    },
    columnStyles: {
      0: { fontStyle: 'bold' }
    }
  });
  
  yPosition = (doc.lastAutoTable?.finalY || yPosition) + 15;
  
  // Cost Comparison
  doc.setFontSize(14);
  doc.text("Cost Comparison", 20, yPosition);
  yPosition += 10;
  
  // Create cost comparison table
  autoTable(doc, {
    startY: yPosition,
    head: [['Solution', 'Monthly Cost', 'Annual Cost', 'One-Time Setup Fee']],
    body: [
      ['Current Human Staff', formatCurrency(params.results.humanCostMonthly), formatCurrency(params.results.humanCostMonthly * 12), 'N/A'],
      ['ChatSites.ai Solution (Your Cost)', formatCurrency(params.results.aiCostMonthly.total), formatCurrency(params.results.aiCostMonthly.total * 12), formatCurrency(params.results.aiCostMonthly.setupFee)]
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [0, 121, 183],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      cellPadding: 5,
      fontSize: 10
    },
    columnStyles: {
      0: { fontStyle: 'bold' }
    }
  });
  
  yPosition = (doc.lastAutoTable?.finalY || yPosition) + 20;
  
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  // Rapid Implementation Process
  doc.setFontSize(16);
  doc.text("Rapid Implementation Process", 20, yPosition);
  yPosition += 15;
  
  // Implementation Process details as shown in the image
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
  
  yPosition += (implementationSteps.length * 20) + 15;
  
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
  
  yPosition += (nextSteps.length * 15) + 20;
  
  // Footer with contact information
  doc.setFontSize(12);
  doc.setTextColor(0, 121, 183);
  doc.text("Contact Us:", 20, 270);
  doc.setFontSize(10);
  doc.text("Email: info@chatsites.ai", 20, 277);
  doc.text("Phone: +1 480 862 0288", 20, 284);
  doc.text("Website: www.chatsites.ai", 20, 291);
  
  return doc;
};
