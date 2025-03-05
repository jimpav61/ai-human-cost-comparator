
import jsPDF from 'jspdf';
import { GeneratePDFParams, JsPDFWithAutoTable, CalculationResults } from './types';
import { addHeaderSection } from './sections/headerSection';
import { addPlanSection } from './sections/planSection';
import { addCostSummarySection } from './sections/costSummarySection';
import { addCostBreakdownSection } from './sections/costBreakdownSection';
import { addRecommendationsSection } from './sections/recommendationsSection';
import { addAIPlacementsSection } from './sections/aiPlacementsSection';
import { addContactSection } from './sections/contactSection';

export const generatePDF = (params: GeneratePDFParams): JsPDFWithAutoTable => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  
  console.log("PDF generation starting with parameters:", params);
  
  // Validate required parameters to ensure we have data
  const validatedParams = {
    ...params,
    companyName: params.companyName || "Your Company",
    contactInfo: params.contactInfo || "Client",
    email: params.email || "client@example.com",
    phoneNumber: params.phoneNumber || "",
    industry: params.industry || "Other",
    employeeCount: params.employeeCount || 5,
    results: params.results || {
      humanCostMonthly: 15000,
      aiCostMonthly: {
        voice: 0,
        chatbot: 229,
        total: 229,
        setupFee: 1149
      },
      basePriceMonthly: 229,
      monthlySavings: 14771,
      yearlySavings: 177252,
      savingsPercentage: 98,
      breakEvenPoint: {
        voice: 0,
        chatbot: 0
      },
      humanHours: {
        dailyPerEmployee: 8,
        weeklyTotal: 160,
        monthlyTotal: 693,
        yearlyTotal: 8320
      },
      annualPlan: 2149
    } as CalculationResults,
    additionalVoiceMinutes: typeof params.additionalVoiceMinutes === 'number' ? params.additionalVoiceMinutes : 0,
    includedVoiceMinutes: typeof params.includedVoiceMinutes === 'number' ? params.includedVoiceMinutes : 600,
    tierName: params.tierName || "Growth Plan",
    aiType: params.aiType || "Text Only"
  };
  
  console.log("Validated PDF parameters:", validatedParams);
  
  // Add header section with contact info
  let currentY = addHeaderSection(
    doc, 
    validatedParams.companyName, 
    validatedParams.contactInfo, 
    validatedParams.email, 
    validatedParams.phoneNumber,
    validatedParams.industry,
    validatedParams.employeeCount
  );

  // Add selected plan details
  currentY = addPlanSection(
    doc, 
    currentY, 
    validatedParams.tierName, 
    validatedParams.aiType,
    validatedParams.results.aiCostMonthly?.setupFee,
    validatedParams.includedVoiceMinutes,
    validatedParams.additionalVoiceMinutes
  );

  // Add cost summary table
  currentY = addCostSummarySection(doc, currentY, validatedParams.results);

  // Add cost breakdown
  currentY = addCostBreakdownSection(
    doc, 
    currentY, 
    validatedParams.results.basePriceMonthly,
    validatedParams.additionalVoiceMinutes,
    validatedParams.results.aiCostMonthly?.total
  );

  // Add implementation recommendations
  currentY = addRecommendationsSection(doc, currentY, validatedParams.businessSuggestions);

  // Add AI integration opportunities
  currentY = addAIPlacementsSection(doc, currentY, validatedParams.aiPlacements);

  // Add contact section
  addContactSection(doc, currentY, validatedParams.employeeCount);

  return doc;
};

export * from './types';
