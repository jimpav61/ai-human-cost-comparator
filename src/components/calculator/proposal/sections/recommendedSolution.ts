
import { JsPDFWithAutoTable, SectionParams } from '../types';

export const addRecommendedSolution = (doc: JsPDFWithAutoTable, yPosition: number, params: SectionParams): number => {
  // Recommended Solution
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Recommended Solution", 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  
  // Get tier name and AI type
  const tierName = params.tierName || 'Starter Plan';
  const aiType = params.aiType || 'Text Only';
  
  // Plan details
  let planText = `Based on your specific needs, we recommend our ${tierName}. This provides optimal functionality while maximizing your return on investment. The plan includes ${params.results?.aiCostMonthly.setupFee > 500 ? '600' : '0'} free voice minutes per month.`;
  
  const splitPlanText = doc.splitTextToSize(planText, 170);
  doc.text(splitPlanText, 20, yPosition);
  
  return yPosition + splitPlanText.length * 7 + 15;
};
