
import { ProcessedLeadData } from "../types";
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';
import { addHeaderSection } from '@/components/calculator/pdf/sections/headerSection';
import { addPlanSection } from '@/components/calculator/pdf/sections/planSection';
import { addCostSummarySection } from '@/components/calculator/pdf/sections/costSummarySection';
import { addCostBreakdownSection } from '@/components/calculator/pdf/sections/costBreakdownSection';
import { addRecommendationsSection } from '@/components/calculator/pdf/sections/recommendationsSection';
import { addAIPlacementsSection } from '@/components/calculator/pdf/sections/aiPlacementsSection';
import { addContactSection } from '@/components/calculator/pdf/sections/contactSection';
import { ensureCalculationResults } from '@/components/calculator/pdf/types';

export const addDocumentContent = (doc: JsPDFWithAutoTable, data: ProcessedLeadData): void => {
  console.log("Adding content to PDF document with data:", data);
  
  // Add header section with contact info - no branding at the top
  let currentY = addHeaderSection(
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

  // Add cost summary table - convert SharedResults to CalculationResults
  const calculationResults = ensureCalculationResults(data.results);
  currentY = addCostSummarySection(doc, currentY, calculationResults);

  // Always add the cost breakdown section to match frontend
  // Convert SharedResults to CalculationResults for the cost breakdown section
  currentY = addCostBreakdownSection(
    doc, 
    currentY, 
    calculationResults
  );

  // Add implementation recommendations
  currentY = addRecommendationsSection(doc, currentY, data.businessSuggestions);

  // Add AI integration opportunities
  currentY = addAIPlacementsSection(doc, currentY, data.aiPlacements);

  // Add contact section
  addContactSection(doc, currentY, data.employeeCount);
};
