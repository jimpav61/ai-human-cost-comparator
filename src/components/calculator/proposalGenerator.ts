
import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { CalculationResults } from '@/hooks/useCalculator';
import { AI_RATES } from '@/constants/pricing';
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
  
  // Add some spacing
  yPosition += 5;

  // Introduction paragraph - customized with industry if available
  const industrySpecificPhrase = params.industry 
    ? `in the ${params.industry} industry` 
    : "in your industry";
    
  const employeeSizePhrase = params.employeeCount 
    ? `with ${params.employeeCount} employees` 
    : "of your size";
    
  const introText = `Thank you for considering ChatSites.ai as your AI solution provider. After a detailed analysis of ${params.companyName}'s current operations and benchmarks ${industrySpecificPhrase}, we've crafted a transformative AI implementation strategy specifically tailored for organizations ${employeeSizePhrase}. Our approach is designed to revolutionize your customer service operations while delivering substantial and sustainable cost savings.`;
  
  const splitIntro = doc.splitTextToSize(introText, 170);
  doc.text(splitIntro, 20, yPosition);

  // Industry challenges - customize based on industry if available
  yPosition += splitIntro.length * 7;
  
  let challengesText = "";
  if (params.industry) {
    switch(params.industry) {
      case "Healthcare":
        challengesText = "In today's rapidly evolving healthcare landscape, organizations face unique challenges including patient information management, appointment scheduling, and providing timely care information. Our AI-powered solution addresses these specific healthcare challenges.";
        break;
      case "Retail":
        challengesText = "Retail businesses today must balance personalized customer service with efficient operations and inventory management. Our AI solution helps you deliver exceptional shopping experiences while optimizing operational costs.";
        break;
      case "Financial Services":
      case "Banking & Finance":
        challengesText = "Financial service providers must maintain regulatory compliance while delivering responsive customer service and managing complex transactions. Our AI tools can streamline operations while ensuring security and compliance.";
        break;
      default:
        challengesText = `In today's rapidly evolving ${params.industry} landscape, organizations like yours face increasing pressure to deliver exceptional customer experiences while managing operational costs. Our AI-powered solution addresses these challenges head-on.`;
    }
  } else {
    challengesText = "In today's rapidly evolving business landscape, organizations like yours face increasing pressure to deliver exceptional customer experiences while managing operational costs. Our AI-powered solution addresses these challenges head-on, allowing you to stay competitive and agile.";
  }
  
  const splitChallenges = doc.splitTextToSize(challengesText, 170);
  doc.text(splitChallenges, 20, yPosition);

  // Recommended solution - based on the selected tier and plan
  yPosition += splitChallenges.length * 7 + 10;
  doc.setFontSize(14);
  doc.text("Recommended Solution", 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  
  // Plan details
  let planText = `Based on your specific needs, we recommend our ${params.tierName || ''} (${params.aiType || ''}) solution. This tailored package provides optimal functionality while maximizing your return on investment.`;
  const splitPlanText = doc.splitTextToSize(planText, 170);
  doc.text(splitPlanText, 20, yPosition);
  
  // Add pricing table for the detailed plan breakdown
  const setupFee = params.results.aiCostMonthly?.setupFee || 0;
  const annualPlanCost = params.results.annualPlan || (params.results.aiCostMonthly?.total * 10 || 0);
  
  autoTable(doc, {
    startY: yPosition + splitPlanText.length * 7 + 5,
    head: [["Pricing Component", "Details", "Cost"]],
    body: [
      ["Monthly Base Fee", params.tierName || "Custom Plan", formatCurrency(params.results.aiCostMonthly?.total || 0)],
      ["One-time Setup Fee", "Non-refundable", formatCurrency(setupFee)],
      ["Annual Plan Option", "Includes 2 months FREE!", formatCurrency(annualPlanCost)],
      ["Estimated Monthly Savings", "vs. current operations", formatCurrency(params.results.monthlySavings || 0)],
      ["Projected Annual Savings", "First year", formatCurrency(params.results.yearlySavings || 0)]
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'right' }
    },
  });
  
  // Get the last Y position after the table
  yPosition = (doc.lastAutoTable?.finalY || yPosition + 40) + 10;
  
  // Add detailed usage information if we have pricing details
  if (params.pricingDetails && params.pricingDetails.length > 0) {
    doc.setFontSize(14);
    doc.text("Detailed Usage Analysis", 20, yPosition);
    
    yPosition += 8;
    
    // Create an array to store the pricing breakdown data for the table
    const pricingBreakdownData = [];
    
    // Process each pricing detail to add to the table
    params.pricingDetails.forEach(detail => {
      if (detail.title === 'Text AI') {
        pricingBreakdownData.push(
          ["Text AI Base Fee", "", formatCurrency(detail.base || 0)],
          ["Message Volume", `${formatNumber(detail.totalMessages || 0)} messages/month`, ""],
          ["Message Rate", detail.rate, ""],
          ["Message Usage Cost", "", formatCurrency(detail.usageCost || 0)]
        );
        
        if (detail.volumeDiscount && detail.volumeDiscount > 0) {
          pricingBreakdownData.push(
            ["Volume Discount", "Based on message volume", `-${formatCurrency(detail.volumeDiscount)}`]
          );
        }
        
        pricingBreakdownData.push(
          ["Total Text AI Cost", "", formatCurrency(detail.monthlyCost)]
        );
      } else if (detail.title === 'Voice AI') {
        pricingBreakdownData.push(
          ["Included Voice Minutes", detail.rate.includes("included") ? detail.rate.split("after ")[1].split(" included")[0] : "0", "Included"],
          ["Monthly Voice Minutes", `${formatNumber(detail.totalMinutes || 0)} minutes/month`, ""],
          ["Voice Rate", detail.rate, ""],
          ["Voice Usage Cost", "", formatCurrency(detail.usageCost || 0)],
          ["Total Voice AI Cost", "", formatCurrency(detail.monthlyCost)]
        );
      }
    });
    
    // Add detailed pricing breakdown table
    autoTable(doc, {
      startY: yPosition,
      body: pricingBreakdownData,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right' }
      },
    });
    
    // Get the last Y position after the table
    yPosition = (doc.lastAutoTable?.finalY || yPosition + 60) + 10;
  }
  
  // Human Resource Cost Analysis
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.text("Human Resource Cost Analysis", 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  
  // Calculate hourly rate safely
  const monthlyHours = params.results.humanHours?.monthlyTotal || 160;
  const hourlyCost = monthlyHours > 0 ? 
    (params.results.humanCostMonthly || 0) / monthlyHours : 
    0;
  
  // Add human resource cost breakdown table
  autoTable(doc, {
    startY: yPosition,
    head: [["Resource Metric", "Details", "Value"]],
    body: [
      ["Hourly Labor Rate", "Including benefits & overhead", formatCurrency(hourlyCost)],
      ["Monthly Hours", "Total across all staff", `${formatNumber(monthlyHours)} hours`],
      ["Monthly Labor Cost", "Current operation", formatCurrency(params.results.humanCostMonthly || 0)],
      ["Annual Labor Cost", "Current operation", formatCurrency((params.results.humanCostMonthly || 0) * 12)],
      ["Cost Reduction", "With AI implementation", `${Math.abs(params.results.savingsPercentage || 0).toFixed(1)}%`]
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'right' }
    },
  });
  
  // Value Proposition
  yPosition = (doc.lastAutoTable?.finalY || yPosition + 60) + 10;
  
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.text("Value Proposition", 20, yPosition);
  
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
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(14);
  doc.text("Financial Impact & ROI Analysis", 20, yPosition);

  // Create a professional summary of savings - with safe fallbacks for all values
  const monthlySavings = formatCurrency(params.results.monthlySavings || 3500);
  const yearlySavings = formatCurrency(params.results.yearlySavings || 42000);
  const savingsPercent = Math.abs(params.results.savingsPercentage || 90).toFixed(1);

  // Calculate ROI based on employee count if available
  const employeeMultiplier = params.employeeCount ? Math.min(params.employeeCount / 10, 5) : 1;
  const employeeBasedROI = params.employeeCount ? `${Math.max(1, Math.round(3 - employeeMultiplier * 0.5))} to ${Math.round(3 + employeeMultiplier)} days` : "1 to 3 days";

  // Try to safely parse the yearly savings for 5-year projection
  let fiveYearSavings;
  try {
    const yearlyValue = Number(yearlySavings.replace(/[^0-9.-]+/g, ''));
    fiveYearSavings = isNaN(yearlyValue) ? formatCurrency(210000) : formatCurrency(yearlyValue * 5);
  } catch (e) {
    console.warn('Error calculating 5-year savings:', e);
    fiveYearSavings = formatCurrency(210000);
  }

  autoTable(doc, {
    startY: yPosition + 5,
    head: [["Metric", "Potential Impact"]],
    body: [
      ["Monthly Cost Reduction", monthlySavings],
      ["Annual Cost Reduction", yearlySavings],
      ["Efficiency Improvement", `${savingsPercent}%`],
      ["Implementation Timeline", "5 business days or less"],
      ["ROI Timeline", employeeBasedROI],
      ["5-Year Projected Savings", fiveYearSavings]
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

  // Implementation Process - updated to reflect rapid 5-day timeline
  doc.setFontSize(14);
  doc.text("Rapid Implementation Process", 20, yPosition);
  
  autoTable(doc, {
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
      ["• Regular Performance Reviews", "Monthly analysis of AI performance and optimization opportunities"]
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
  const getStartedText = "Contact our dedicated implementation team to begin your AI transformation journey. We're ready to help you revolutionize your customer service operations and achieve significant cost savings within just 5 business days.";
  const splitGetStarted = doc.splitTextToSize(getStartedText, 170);
  doc.text(splitGetStarted, 20, yPosition + 10);
  
  // Contact Information with only email, phone, and website
  yPosition += splitGetStarted.length * 7 + 20;
  doc.setTextColor(246, 82, 40); // brand color
  doc.setFontSize(12);
  doc.text("Contact Us:", 20, yPosition);
  doc.text("Email: info@chatsites.ai", 20, yPosition + 8);
  doc.text("Phone: +1 480 862 0288", 20, yPosition + 16);
  doc.text("Website: www.chatsites.ai", 20, yPosition + 24);

  // Footer with personalization and industry/employee info if available
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  let footerText = `Proposal prepared exclusively for ${params.companyName}`;
  if (params.industry) {
    footerText += ` (${params.industry})`;
  }
  if (params.employeeCount) {
    footerText += ` with ${params.employeeCount} employees`;
  }
  doc.text(footerText, 20, 280);
  doc.text(`Generated on ${reportDate} | Valid for 30 days`, 20, 287);

  return doc;
};

