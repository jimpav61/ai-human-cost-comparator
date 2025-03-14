
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { generateReportPDF } from "../pdf/generator";
import { saveReportToStorageWithRetry } from "../retryUtils";
import { ReportGenerationResult } from "../types";
import { getSafeFileName } from "../validation";
import { verifyReportsBucket } from "../bucketUtils";

export async function generateAndSaveReport(
  lead: Lead,
  options: { skipStorage?: boolean; retryCount?: number } = {}
): Promise<ReportGenerationResult> {
  try {
    console.log("Starting report generation and save process for lead:", lead.id);
    
    // First, check if the reports bucket exists
    if (!options.skipStorage) {
      const bucketExists = await verifyReportsBucket();
      if (!bucketExists) {
        console.warn("Reports bucket could not be verified or created");
        toast({
          title: "Storage Warning",
          description: "Cloud storage is not available. Your report will be downloaded only.",
          variant: "destructive"
        });
      } else {
        console.log("✅ Storage bucket verified and ready for saving");
      }
    }
    
    // Generate the PDF document
    const doc = generateReportPDF(lead);
    console.log("✅ PDF document generated successfully");
    
    // Get a safe filename
    const safeFileName = getSafeFileName(lead);
    const fileName = `${safeFileName}_report.pdf`;
    
    // If skipStorage is true, just return success without saving
    if (options.skipStorage) {
      console.log("Storage skipped as requested");
      return {
        success: true,
        message: "Report generated successfully (storage skipped)",
      };
    }
    
    console.log("Attempting to save report to storage...");
    
    // Save the report with retry mechanism
    const maxRetries = options.retryCount || 3;
    const result = await saveReportToStorageWithRetry(
      doc,
      lead,
      fileName,
      maxRetries
    );
    
    if (!result.reportId || !result.pdfUrl) {
      console.error("Failed to save report after multiple attempts");
      throw new Error("Failed to save report after multiple attempts");
    }
    
    console.log("✅ Report saved successfully with ID:", result.reportId);
    console.log("✅ Report URL:", result.pdfUrl);
    
    return {
      success: true,
      message: "Report generated and saved successfully",
      reportId: result.reportId,
      pdfUrl: result.pdfUrl,
    };
  } catch (error) {
    console.error("Error in generateAndSaveReport:", error);
    
    toast({
      title: "Error",
      description: "Failed to generate and save report",
      variant: "destructive",
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
