
import { Lead } from "@/types/leads";
import { toast } from "@/components/ui/use-toast";
import { generateReportPDF, convertPDFToBlob } from "./pdfUtils";
import { verifyReportsBucket, saveReportData, savePDFToStorage, saveReportToStorageWithRetry } from "./storageUtils";
import { ensureLeadHasValidId, getSafeFileName } from "./validation";
import { ReportGenerationResult } from "./types";

/**
 * Generate a PDF report for a lead and save it
 */
export async function generateAndSaveReport(lead: Lead): Promise<ReportGenerationResult> {
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
    
    // Ensure lead has a valid UUID - replace temp-id with a real UUID
    const leadWithValidId = ensureLeadHasValidId(lead);
    
    // Generate PDF
    const pdfDoc = generateReportPDF(leadWithValidId);
    
    // Create safe filename
    const safeFileName = getSafeFileName(leadWithValidId);
    
    // Save/download the document for the user
    pdfDoc.save(`${safeFileName}-ChatSites-ROI-Report.pdf`);
    
    // Save to database and storage
    saveReportToStorageWithRetry(leadWithValidId, pdfDoc)
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
