
import { JsPDFWithAutoTable } from '../types';
import { SectionParams } from '../types';

export const addIntroduction = (doc: JsPDFWithAutoTable, yPosition: number, params: SectionParams): number => {
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
  
  return yPosition + splitIntro.length * 7 + 10;
};
