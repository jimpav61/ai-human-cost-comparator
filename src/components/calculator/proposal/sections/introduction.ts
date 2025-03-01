
import { JsPDFWithAutoTable } from '../types';

export const addIntroduction = (doc: JsPDFWithAutoTable, yPosition: number, params: any): number => {
  // Personalized Introduction
  yPosition += 15;
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
  
  return yPosition + splitIntro.length * 7;
};
