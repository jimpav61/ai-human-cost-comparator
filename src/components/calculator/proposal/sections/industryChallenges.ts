
import { JsPDFWithAutoTable } from '../types';

export const addIndustryChallenges = (doc: JsPDFWithAutoTable, yPosition: number, params: any): number => {
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
  
  return yPosition + splitChallenges.length * 7;
};
