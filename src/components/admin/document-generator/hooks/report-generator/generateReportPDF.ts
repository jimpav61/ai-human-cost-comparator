
import { Lead } from "@/types/leads";
import { generatePDF } from "@/components/calculator/pdfGenerator";
import { ProcessedLeadData } from "./processLeadData";
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';

export const generateReportPDF = (processedData: ProcessedLeadData): JsPDFWithAutoTable => {
  console.log("Generating PDF report with:", processedData);
  
  try {
    // Generate the PDF using the imported function
    const doc = generatePDF({
      contactInfo: processedData.contactInfo,
      companyName: processedData.companyName,
      email: processedData.email,
      phoneNumber: processedData.phoneNumber,
      industry: processedData.industry,
      employeeCount: processedData.employeeCount,
      results: processedData.results,
      tierName: processedData.tierName,
      aiType: processedData.aiType,
      additionalVoiceMinutes: processedData.additionalVoiceMinutes,
      includedVoiceMinutes: processedData.includedVoiceMinutes,
      businessSuggestions: processedData.businessSuggestions,
      aiPlacements: processedData.aiPlacements
    });
    
    return doc;
  } catch (error) {
    console.error("Error in PDF generation:", error);
    throw error;
  }
};
