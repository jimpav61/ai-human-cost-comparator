
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
      toast({
        title: "Missing Data",
        description: "Cannot generate report: missing required lead data",
        variant: "destructive"
      });
      return {
        success: false,
        message: "Missing required data for report generation"
      };
    }

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn("User is not authenticated - report will be generated for download only");
      // Continue with PDF generation for download only
      const validatedLead = ensureLeadHasValidId(lead);
      const pdfDoc = generateReportPDF(validatedLead);
      pdfDoc.save(`${getSafeFileName(validatedLead)}-ChatSites-ROI-Report.pdf`);
      
      toast({
        title: "Report Generated",
        description: "Report was generated for download only as you're not logged in",
        variant: "default"
      });
      
      return {
        success: true,
        message: "Report generated for download only (not logged in)"
      };
    }

    // Verify bucket exists before proceeding
    const bucketAccessible = await verifyReportsBucket();
    if (!bucketAccessible) {
      console.error("Report generator: Reports bucket is not accessible");
      toast({
        title: "Storage Error",
        description: "Reports storage is not accessible. Report will be generated for download only.",
        variant: "default"
      });
      
      // Still generate PDF for download even if we can't save to storage
      const validatedLead = ensureLeadHasValidId(lead);
      const pdfDoc = generateReportPDF(validatedLead);
      pdfDoc.save(`${getSafeFileName(validatedLead)}-ChatSites-ROI-Report.pdf`);
      
      return {
        success: false,
        message: "Reports storage bucket is not accessible. Please check Supabase configuration."
      };
    }

    // Ensure lead has valid ID
    const validatedLead = ensureLeadHasValidId(lead);
    console.log("Report generator: Validated lead ID:", validatedLead.id);

    const reportId = await saveReportData(validatedLead);
    if (!reportId) {
      toast({
        title: "Database Error",
        description: "Failed to save report data. Report will be generated for download only.",
        variant: "default"
      });
      
      // Still generate PDF for download
      const pdfDoc = generateReportPDF(validatedLead);
      pdfDoc.save(`${getSafeFileName(validatedLead)}-ChatSites-ROI-Report.pdf`);
      
      return {
        success: false,
        message: "Failed to save report data"
      };
    }

    // Generate and save PDF
    try {
      const pdfDoc = generateReportPDF(validatedLead);
      
      // Save PDF to Supabase storage
      const pdfBlob = await convertPDFToBlob(pdfDoc);
      
      // Extra validation for PDF blob
      if (!pdfBlob || pdfBlob.size === 0) {
        console.error("Report generator: Generated PDF blob is invalid or empty");
        toast({
          title: "PDF Error",
          description: "Failed to generate valid PDF file",
          variant: "destructive"
        });
        return {
          success: false,
          message: "Failed to generate valid PDF"
        };
      }
      
      const pdfUrl = await savePDFToStorage(reportId, pdfBlob);
      
      if (!pdfUrl) {
        console.error("Report generator: Failed to save PDF to storage");
        toast({
          title: "Storage Warning",
          description: "Report data saved, but PDF storage failed. Report is available for download.",
          variant: "default"
        });
        
        // Still allow user to download the PDF
        pdfDoc.save(`${getSafeFileName(validatedLead)}-ChatSites-ROI-Report.pdf`);
        
        return {
          success: true,  // Still return success since report data was saved
          message: "Report data saved, but PDF storage failed",
          reportId
        };
      }
      
      console.log("Report successfully saved to storage with URL:", pdfUrl);
      toast({
        title: "Success",
        description: "Report generated and saved successfully",
        variant: "default"
      });
      
      return {
        success: true,
        message: "Report generated and saved successfully",
        reportId,
        pdfUrl
      };
    } catch (pdfError) {
      console.error("Report generator: PDF generation failed", pdfError);
      toast({
        title: "PDF Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
      
      // Even if PDF generation fails, we still saved the report data
      return {
        success: true,
        message: "Report data saved, but PDF generation failed",
        reportId
      };
    }
  } catch (error) {
    console.error("Report generator: Unexpected error", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Unknown error in report generation",
      variant: "destructive"
    });
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
      toast({
        title: "Missing Data",
        description: "Cannot generate report: company name or calculator results missing",
        variant: "destructive"
      });
      return false;
    }
    
    // Ensure lead has a valid UUID - replace temp-id with a real UUID
    const leadWithValidId = ensureLeadHasValidId(lead);
    console.log("Using lead with validated ID:", leadWithValidId.id);
    
    // Generate PDF
    const pdfDoc = generateReportPDF(leadWithValidId);
    
    // Create safe filename
    const safeFileName = getSafeFileName(leadWithValidId);
    
    // Save/download the document for the user
    pdfDoc.save(`${safeFileName}-ChatSites-ROI-Report.pdf`);
    
    toast({
      title: "Success",
      description: "ROI Report downloaded successfully",
      variant: "default"
    });
    
    // Try to save to database and storage in the background
    console.log("Attempting to save report to storage in the background...");
    
    // Check if user is authenticated before attempting to save
    supabase.auth.getSession().then(({ data: { session }}) => {
      if (!session) {
        console.log("User is not authenticated - skipping report storage");
        return;
      }
      
      verifyReportsBucket().then(bucketAccessible => {
        if (!bucketAccessible) {
          console.error("Cannot save report to storage - bucket not accessible");
          return;
        }
        
        // Attempt to save to storage
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
      });
    });
    
    return true;
  } catch (error) {
    console.error("Error generating report:", error);
    toast({
      title: "Error",
      description: "Failed to generate report. Please try again.",
      variant: "destructive"
    });
    return false;
  }
}
