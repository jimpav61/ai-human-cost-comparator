
import { ProcessedLeadData } from "../processLeadData";
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';
import { addHeaderSection } from '@/components/calculator/pdf/sections/headerSection';
import { addPlanSection } from '@/components/calculator/pdf/sections/planSection';
import { addCostSummarySection } from '@/components/calculator/pdf/sections/costSummarySection';
import { addCostBreakdownSection } from '@/components/calculator/pdf/sections/costBreakdownSection';
import { addRecommendationsSection } from '@/components/calculator/pdf/sections/recommendationsSection';
import { addAIPlacementsSection } from '@/components/calculator/pdf/sections/aiPlacementsSection';
import { addContactSection } from '@/components/calculator/pdf/sections/contactSection';
import { addBranding } from '@/components/calculator/proposal/sections/branding';

export const addDocumentContent = (doc: JsPDFWithAutoTable, data: ProcessedLeadData): void => {
  console.log("Adding content to PDF document with data:", data);
  
  // Add branding at the top of the document
  let currentY = addBranding(doc, 20);
  
  // Add header section with contact info
  currentY = addHeaderSection(
    doc, 
    data.companyName, 
    data.contactInfo, 
    data.email, 
    data.phoneNumber,
    data.industry,
    data.employeeCount
  );

  // Add selected plan details if provided
  if (data.tierName && data.aiType) {
    currentY = addPlanSection(
      doc, 
      currentY, 
      data.tierName, 
      data.aiType,
      data.results.aiCostMonthly.setupFee,
      data.includedVoiceMinutes,
      data.additionalVoiceMinutes
    );
  }

  // Add cost summary table
  currentY = addCostSummarySection(doc, currentY, data.results);

  // Add cost breakdown section (only if there are additional voice minutes)
  if (data.additionalVoiceMinutes && data.additionalVoiceMinutes > 0) {
    currentY = addCostBreakdownSection(
      doc, 
      currentY, 
      data.results.basePriceMonthly,
      data.additionalVoiceMinutes,
      data.results.aiCostMonthly.total
    );
  }

  // Add implementation recommendations
  currentY = addRecommendationsSection(doc, currentY, data.businessSuggestions);

  // Add AI integration opportunities
  currentY = addAIPlacementsSection(doc, currentY, data.aiPlacements);

  // Add contact section
  addContactSection(doc, currentY, data.employeeCount);
};
