
import { Lead } from "@/types/leads";
import { toast } from "@/components/ui/use-toast";
import { ReportGenerationResult } from "../types";
import { 
  checkUserAuthentication,
  verifyReportsBucket,
  saveReportData,
  savePDFToStorage
} from "../storageUtils";
import { generateReportPDF } from "../pdf/generator";
import { convertPDFToBlob } from "../pdf/conversion";
import { getSafeFileName } from "../validation";

/**
 * Generate a PDF report for a lead and save it to database and storage
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
    const { session } = await checkUserAuthentication();
    
    if (!session) {
      console.warn("User is not authenticated - report will be generated for download only");
      // Continue with PDF generation for download only
      const pdfDoc = generateReportPDF(lead);
      pdfDoc.save(`${getSafeFileName(lead)}-ChatSites-ROI-Report.pdf`);
      
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
      const pdfDoc = generateReportPDF(lead);
      pdfDoc.save(`${getSafeFileName(lead)}-ChatSites-ROI-Report.pdf`);
      
      return {
        success: false,
        message: "Reports storage bucket is not accessible. Please check Supabase configuration."
      };
    }

    // All leads already have valid UUIDs, no need to validate
    console.log("Report generator: Using lead ID:", lead.id);

    const reportId = await saveReportData(lead);
    if (!reportId) {
      toast({
        title: "Database Error",
        description: "Failed to save report data. Report will be generated for download only.",
        variant: "default"
      });
      
      // Still generate PDF for download
      const pdfDoc = generateReportPDF(lead);
      pdfDoc.save(`${getSafeFileName(lead)}-ChatSites-ROI-Report.pdf`);
      
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
        pdfDoc.save(`${getSafeFileName(lead)}-ChatSites-ROI-Report.pdf`);
        
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
