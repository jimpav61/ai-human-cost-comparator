
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { generateReportPDF } from "../pdf/generator";
import { saveReportToStorageWithRetry } from "../retryUtils";
import { ReportGenerationResult } from "../types";
import { getSafeFileName } from "../validation";

export async function generateAndSaveReport(
  lead: Lead,
  options: { skipStorage?: boolean; retryCount?: number } = {}
): Promise<ReportGenerationResult> {
  try {
    console.log("Starting report generation and save process for lead:", lead.id);
    
    // Generate the PDF document
    const doc = generateReportPDF(lead);
    
    // Get a safe filename
    const safeFileName = getSafeFileName(lead);
    const fileName = `${safeFileName}_report.pdf`;
    
    // If skipStorage is true, just return success without saving
    if (options.skipStorage) {
      return {
        success: true,
        message: "Report generated successfully (storage skipped)",
      };
    }
    
    // Save the report with retry mechanism
    const maxRetries = options.retryCount || 3;
    const result = await saveReportToStorageWithRetry(
      doc,
      lead,
      fileName,
      maxRetries
    );
    
    if (!result.reportId || !result.pdfUrl) {
      throw new Error("Failed to save report after multiple attempts");
    }
    
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
