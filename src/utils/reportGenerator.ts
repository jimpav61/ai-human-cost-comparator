
import { Lead } from "@/types/leads";
import { CalculationResults } from "@/hooks/calculator/types";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";
import { generatePDF } from "@/components/calculator/pdf";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";

/**
 * Generate a PDF report for a lead and save it
 */
export async function generateAndSaveReport(lead: Lead): Promise<{
  success: boolean;
  message: string;
  reportId?: string;
  pdfUrl?: string;
}> {
  try {
    console.log("Report generator: Starting for lead", lead.id);

    // Validate input data
    if (!lead || !lead.company_name || !lead.calculator_results) {
      console.error("Report generator: Missing required data");
      return {
        success: false,
        message: "Missing required data for report generation"
      };
    }

    const reportId = await saveReportData(lead);
    if (!reportId) {
      return {
        success: false,
        message: "Failed to save report data"
      };
    }

    // Generate and save PDF
    try {
      const pdfDoc = generateReportPDF(lead);
      
      // Save PDF to Supabase storage
      const pdfBlob = await convertPDFToBlob(pdfDoc);
      const pdfUrl = await savePDFToStorage(reportId, pdfBlob);
      
      return {
        success: true,
        message: "Report generated and saved successfully",
        reportId,
        pdfUrl
      };
    } catch (pdfError) {
      console.error("Report generator: PDF generation failed", pdfError);
      
      // Even if PDF generation fails, we still saved the report data
      return {
        success: true,
        message: "Report data saved, but PDF generation failed",
        reportId
      };
    }
  } catch (error) {
    console.error("Report generator: Unexpected error", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error in report generation"
    };
  }
}

/**
 * Save report data to the database
 */
async function saveReportData(lead: Lead): Promise<string | null> {
  try {
    // Prepare report data
    const reportData = {
      id: crypto.randomUUID(), // Generate a new UUID for the report
      lead_id: lead.id,
      company_name: lead.company_name,
      contact_name: lead.name,
      email: lead.email,
      phone_number: lead.phone_number || null,
      calculator_inputs: lead.calculator_inputs,
      calculator_results: lead.calculator_results,
      report_date: new Date().toISOString(),
      version: 1 // Default to version 1
    };

    // Save to database
    const { data, error } = await supabase
      .from('generated_reports')
      .insert(reportData)
      .select('id')
      .single();

    if (error) {
      console.error("Failed to save report to database:", error);
      return null;
    }

    console.log("Report saved to database with ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Unexpected error saving report:", error);
    return null;
  }
}

/**
 * Generate PDF document from lead data
 */
function generateReportPDF(lead: Lead): jsPDF {
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
    businessSuggestions: [
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
    ],
    aiPlacements: [
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
    ],
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
async function convertPDFToBlob(pdfDoc: jsPDF): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Output the PDF as an array buffer
      const pdfOutput = pdfDoc.output('arraybuffer');
      
      // Create a Blob from the array buffer
      const blob = new Blob([pdfOutput], { type: 'application/pdf' });
      resolve(blob);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Save PDF to Supabase storage and return the URL
 */
async function savePDFToStorage(reportId: string, pdfBlob: Blob): Promise<string | null> {
  try {
    console.log("Saving PDF to storage for report:", reportId);
    
    // Upload the PDF to Supabase storage
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(`reports/${reportId}.pdf`, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (error) {
      console.error("Failed to upload PDF to storage:", error);
      return null;
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(`reports/${reportId}.pdf`);
    
    if (!urlData) {
      console.error("Failed to get public URL for PDF");
      return null;
    }
    
    console.log("PDF saved to storage with URL:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Unexpected error saving PDF to storage:", error);
    return null;
  }
}
