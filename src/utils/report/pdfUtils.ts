
import { Lead } from "@/types/leads";
import { JsPDFWithAutoTable } from "@/components/calculator/pdf/types";
import { jsPDF } from "jspdf";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";
import { generatePDF } from "@/components/calculator/pdf";

/**
 * Generate PDF document from lead data
 */
export function generateReportPDF(lead: Lead): JsPDFWithAutoTable {
  console.log("Generating PDF for lead:", lead.id);
  
  // Ensure calculator results have the correct structure
  const validatedResults = ensureCompleteCalculatorResults(lead.calculator_results);
  
  // Use the existing generatePDF function from the calculator
  return generatePDF({
    contactInfo: lead.name || 'Valued Client',
    companyName: lead.company_name || 'Your Company',
    email: lead.email || 'client@example.com',
    phoneNumber: lead.phone_number || '',
    industry: lead.industry || 'Other',
    employeeCount: Number(lead.employee_count) || 5,
    results: validatedResults,
    additionalVoiceMinutes: validatedResults.additionalVoiceMinutes || 0,
    includedVoiceMinutes: validatedResults.includedVoiceMinutes || 600,
    businessSuggestions: getBusinessSuggestions(),
    aiPlacements: getAiPlacements(),
    tierName: validatedResults.tierKey === 'starter' ? 'Starter Plan' : 
             validatedResults.tierKey === 'growth' ? 'Growth Plan' : 
             validatedResults.tierKey === 'premium' ? 'Premium Plan' : 'Growth Plan',
    aiType: validatedResults.aiType === 'chatbot' ? 'Text Only' : 
           validatedResults.aiType === 'voice' ? 'Basic Voice' : 
           validatedResults.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
           validatedResults.aiType === 'both' ? 'Text & Basic Voice' : 
           validatedResults.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only'
  });
}

/**
 * Convert PDF document to Blob for storage
 */
export async function convertPDFToBlob(pdfDoc: jsPDF): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Output the PDF as a blob directly
      const pdfOutput = pdfDoc.output('blob');
      resolve(pdfOutput);
    } catch (error) {
      reject(error);
    }
  });
}

// Return standard business suggestions for the report
export function getBusinessSuggestions() {
  return [
    {
      title: "Automate Common Customer Inquiries",
      description: "Implement an AI chatbot to handle frequently asked questions, reducing wait times and freeing up human agents."
    },
    {
      title: "Enhance After-Hours Support",
      description: "Deploy voice AI to provide 24/7 customer service without increasing staffing costs."
    },
    {
      title: "Streamline Onboarding Process",
      description: "Use AI assistants to guide new customers through product setup and initial questions."
    }
  ];
}

// Return standard AI placements for the report
export function getAiPlacements() {
  return [
    {
      role: "Front-line Customer Support",
      capabilities: ["Handle basic inquiries", "Process simple requests", "Collect customer information"]
    },
    {
      role: "Technical Troubleshooting",
      capabilities: ["Guide users through common issues", "Recommend solutions based on symptoms", "Escalate complex problems to human agents"]
    },
    {
      role: "Sales Assistant",
      capabilities: ["Answer product questions", "Provide pricing information", "Schedule demonstrations with sales team"]
    }
  ];
}
