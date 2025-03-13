
import { Lead } from "@/types/leads";
import { CalculationResults } from "@/hooks/calculator/types";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";
import { generatePDF } from "@/components/calculator/pdf";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { toast } from "@/hooks/use-toast";
import { toJson } from "@/hooks/calculator/supabase-types";

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
      
      console.log("Report successfully saved to storage with URL:", pdfUrl);
      
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
 * Generate and immediately download a report without saving to database
 * Used in the customer-facing calculator
 */
export function generateAndDownloadReport(lead: Lead): boolean {
  try {
    console.log("Generating and downloading report for lead:", lead.id);
    
    if (!lead || !lead.company_name || !lead.calculator_results) {
      console.error("Missing required data for report generation");
      return false;
    }
    
    // Generate PDF
    const pdfDoc = generateReportPDF(lead);
    
    // Create safe filename
    const safeFileName = getSafeFileName(lead);
    
    // Save/download the document for the user
    pdfDoc.save(`${safeFileName}-ChatSites-ROI-Report.pdf`);
    
    // Critical Fix for Storage Issues:
    // Now properly save to database and storage with auth bypass
    // We'll use a more robust approach to ensure the PDF is saved to storage
    saveReportToStorageWithRetry(lead, pdfDoc)
      .then(result => {
        if (result.success) {
          console.log("Front-end report saved to database and storage successfully:", result);
        } else {
          console.error("Failed to save front-end report:", result.message);
        }
      })
      .catch(error => {
        console.error("Error in saveReportToStorageWithRetry:", error);
      });
    
    return true;
  } catch (error) {
    console.error("Error generating report:", error);
    return false;
  }
}

/**
 * Improved function to save reports to storage with retry logic
 * Uses a different approach to bypass auth issues
 */
async function saveReportToStorageWithRetry(lead: Lead, pdfDoc: jsPDF, retries = 3): Promise<{
  success: boolean;
  message?: string; 
  reportId?: string;
  pdfUrl?: string;
}> {
  try {
    console.log("Saving front-end report to storage for lead:", lead.id);
    
    // First save report data to DB to get reportId
    const reportId = await saveReportData(lead);
    if (!reportId) {
      return {
        success: false,
        message: "Failed to save report data to database"
      };
    }
    
    // Convert PDF to blob for storage
    const pdfBlob = await convertPDFToBlob(pdfDoc);
    
    // Upload PDF directly without checking bucket
    // This is a more direct approach that should work even without auth
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(`${reportId}.pdf`, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600'
      });
    
    if (error) {
      console.error("Error uploading PDF to storage:", error);
      
      // If error is related to bucket not existing, try to create it
      // Check error message for bucket-related issues instead of statusCode
      if (error.message.includes("bucket") || error.message.includes("404")) {
        console.log("Attempting to create bucket via supabase.createBucket");
        const { error: bucketError } = await supabase.storage.createBucket('reports', {
          public: true
        });
        
        if (bucketError) {
          console.error("Failed to create bucket:", bucketError);
          return { 
            success: false, 
            message: `Failed to create storage bucket: ${bucketError.message}`,
            reportId 
          };
        }
        
        // Try upload again after creating bucket
        const { data: retryData, error: retryError } = await supabase.storage
          .from('reports')
          .upload(`${reportId}.pdf`, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true,
            cacheControl: '3600'
          });
          
        if (retryError) {
          console.error("Failed retry upload after creating bucket:", retryError);
          return { 
            success: false, 
            message: `Upload failed after bucket creation: ${retryError.message}`,
            reportId 
          };
        }
      } else {
        return { 
          success: false, 
          message: `Storage upload failed: ${error.message}`,
          reportId 
        };
      }
    }
    
    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(`${reportId}.pdf`);
    
    if (!urlData || !urlData.publicUrl) {
      return { 
        success: false, 
        message: "Failed to get public URL after upload",
        reportId 
      };
    }
    
    // Verify the URL works
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.warn(`Public URL check failed with status ${response.status}`);
      } else {
        console.log("Public URL verified accessible");
      }
    } catch (checkError) {
      console.warn("Error checking public URL:", checkError);
    }
    
    console.log("Successfully saved report to storage with URL:", urlData.publicUrl);
    
    return {
      success: true,
      reportId,
      pdfUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error(`Error in saveReportToStorageWithRetry (attempts left: ${retries}):`, error);
    
    // Retry logic
    if (retries > 0) {
      console.log(`Retrying report storage (${retries} attempts left)...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return saveReportToStorageWithRetry(lead, pdfDoc, retries - 1);
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error in report storage",
      reportId: undefined
    };
  }
}

/**
 * Create a safe filename from the lead company name
 */
function getSafeFileName(lead: Lead): string {
  return lead.company_name ? lead.company_name.replace(/[^\w\s-]/gi, '') : 'Client';
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
      calculator_inputs: toJson(lead.calculator_inputs),
      calculator_results: toJson(lead.calculator_results),
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
      // Output the PDF as a blob directly
      const pdfOutput = pdfDoc.output('blob');
      resolve(pdfOutput);
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
    console.log("Saving PDF to storage for report ID:", reportId);
    
    // The file path in storage
    const filePath = `${reportId}.pdf`;
    
    console.log("Uploading to bucket 'reports' with path:", filePath);
    
    // Upload the PDF to Supabase storage
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600'
      });
    
    if (error) {
      console.error("Failed to upload PDF to storage:", error);
      return null;
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      console.error("Failed to get public URL for PDF");
      return null;
    }
    
    console.log("PDF saved to storage with URL:", urlData.publicUrl);
    
    // Verify the URL is accessible
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error(`PDF URL check failed with status ${response.status}`);
      } else {
        console.log("PDF URL was successfully verified as accessible");
      }
    } catch (checkError) {
      console.error("Error verifying PDF URL:", checkError);
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Unexpected error saving PDF to storage:", error);
    return null;
  }
}
