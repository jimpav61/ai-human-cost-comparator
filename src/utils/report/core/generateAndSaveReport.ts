
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { generateReportPDF } from "../pdf/generator";
import { saveReportToStorageWithRetry } from "../retryUtils";
import { ReportGenerationResult } from "../types";
import { getSafeFileName } from "../validation";
import { testStorageBucketConnectivity } from "../bucketUtils";

export async function generateAndSaveReport(
  lead: Lead,
  options: { skipStorage?: boolean; retryCount?: number; isAdmin?: boolean } = {}
): Promise<ReportGenerationResult> {
  try {
    console.log("Starting report generation and save process for lead:", lead.id);
    
    // Run storage diagnostics first to identify potential issues
    if (!options.skipStorage) {
      const diagnostics = await testStorageBucketConnectivity();
      console.log("Storage diagnostics:", diagnostics);
      
      if (!diagnostics.success) {
        console.warn("Storage diagnostics failed:", diagnostics.error);
        if (options.isAdmin) {
          toast({
            title: "Storage Warning",
            description: "Cloud storage connectivity check failed. Will attempt to save anyway.",
            variant: "destructive"
          });
        }
      } else {
        console.log("✅ Storage diagnostics passed, bucket exists:", diagnostics.bucketExists);
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
        pdfDoc: doc
      };
    }
    
    console.log("Attempting to save report to storage...");
    
    // Save the report with retry mechanism and increased retry count
    const maxRetries = options.retryCount || 4; // Increase default retries
    const result = await saveReportToStorageWithRetry(
      doc,
      lead,
      fileName,
      maxRetries,
      options.isAdmin
    );
    
    if (!result.reportId || !result.pdfUrl) {
      console.error("Failed to save report after multiple attempts");
      
      // Just return success for downloaded PDF even if cloud save failed
      return {
        success: true,
        message: "Report generated and downloaded successfully, but cloud save failed.",
        pdfDoc: doc
      };
    }
    
    console.log("✅ Report saved successfully with ID:", result.reportId);
    console.log("✅ Report URL:", result.pdfUrl);
    
    return {
      success: true,
      message: "Report generated and saved successfully",
      reportId: result.reportId,
      pdfUrl: result.pdfUrl,
      pdfDoc: doc
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
