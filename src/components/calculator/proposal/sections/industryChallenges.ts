
import { JsPDFWithAutoTable, SectionParams } from '../types';

export const addIndustryChallenges = (doc: JsPDFWithAutoTable, yPosition: number, params: SectionParams): number => {
  // Check if we need to add a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Industry Challenges Section
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header
  doc.text("Industry Challenges", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  
  // Get industry-specific challenges based on the industry parameter
  const industry = params.industry || 'Other';
  const challenges = getIndustryChallenges(industry);
  
  // Introduction to challenges
  const introText = `Organizations in the ${industry} industry face several key challenges that our AI solution addresses:`;
  doc.setTextColor(0, 0, 0); // Black text color for body text
  doc.text(introText, 20, yPosition);
  
  yPosition += 10;
  
  // List the challenges with bullet points
  challenges.forEach((challenge, index) => {
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(246, 82, 40); // Brand color for challenge titles
    doc.text(`• ${challenge.title}`, 20, yPosition + (index * 15));
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0); // Black text color for descriptions
    const descLines = doc.splitTextToSize(challenge.description, 170);
    doc.text(descLines, 25, yPosition + 5 + (index * 15));
  });
  
  return yPosition + (challenges.length * 15) + 10;
};

// Helper function to get industry-specific challenges
function getIndustryChallenges(industry: string): Array<{title: string, description: string}> {
  const defaultChallenges = [
    {
      title: "Rising Customer Expectations",
      description: "Today's customers expect immediate, 24/7 support across multiple channels with consistent quality."
    },
    {
      title: "Staffing Constraints",
      description: "Hiring, training, and retaining qualified staff is increasingly difficult and expensive."
    },
    {
      title: "Scaling Operations",
      description: "Managing fluctuating demand without compromising service quality or increasing costs."
    }
  ];
  
  // Industry-specific challenges
  const industryChallenges: Record<string, Array<{title: string, description: string}>> = {
    "Healthcare": [
      {
        title: "Patient Engagement",
        description: "Maintaining consistent communication with patients while managing high volumes of routine inquiries."
      },
      {
        title: "Administrative Burden",
        description: "Staff spending excessive time on appointment scheduling, insurance verification, and basic information requests."
      },
      {
        title: "Compliance Requirements",
        description: "Ensuring all patient communications meet HIPAA and other regulatory requirements."
      }
    ],
    "Retail": [
      {
        title: "Seasonal Demand Fluctuations",
        description: "Managing customer service during peak shopping periods without overstaffing during slower times."
      },
      {
        title: "Omnichannel Support",
        description: "Providing consistent customer experience across online, mobile, and in-store touchpoints."
      },
      {
        title: "Product Information Management",
        description: "Ensuring accurate and timely responses to diverse product inquiries across expanding inventories."
      }
    ],
    "Financial Services": [
      {
        title: "Complex Regulatory Environment",
        description: "Maintaining compliance with evolving financial regulations while providing responsive customer service."
      },
      {
        title: "Security Concerns",
        description: "Balancing accessibility with robust security protocols to protect sensitive customer information."
      },
      {
        title: "High-Stakes Interactions",
        description: "Managing customer anxiety and expectations during financial transactions and inquiries."
      }
    ],
    "Technology": [
      {
        title: "Technical Support Complexity",
        description: "Addressing increasingly complex technical issues across multiple products and versions."
      },
      {
        title: "Rapid Product Evolution",
        description: "Keeping support staff updated on constantly changing products, features, and solutions."
      },
      {
        title: "User Onboarding",
        description: "Efficiently guiding new users through product setup and initial learning curve."
      }
    ]
  };
  
  // Return industry-specific challenges if available, otherwise default challenges
  return industryChallenges[industry] || defaultChallenges;
}
