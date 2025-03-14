
import { savePDFToStorage } from "./fileUtils";
import { saveReportData } from "./databaseUtils";
import { Lead } from "@/types/leads";
import { jsPDF } from "jspdf";
import { toast } from "@/hooks/use-toast";
import { ReportGenerationResult } from "./types";
import { verifyReportsBucket } from "./bucketUtils";

/**
 * Save a report to storage with retry mechanism
 */
export async function saveReportToStorageWithRetry(
  pdfDoc: jsPDF,
  lead: Lead,
  fileName: string,
  maxRetries: number = 3
): Promise<{ reportId: string | null; pdfUrl: string | null }> {
  let attempts = 0;
  let success = false;
  let pdfUrl: string | null = null;
  let reportId: string | null = null;
  
  // First, make sure the bucket exists
  const bucketVerified = await verifyReportsBucket();
  if (!bucketVerified) {
    console.error("Failed to verify or create reports bucket");
    return { reportId: null, pdfUrl: null };
  }
  
  while (attempts < maxRetries && !success) {
    attempts++;
    console.log(`Attempt ${attempts} of ${maxRetries} to save report...`);
    
    try {
      // Save PDF to storage
      pdfUrl = await savePDFToStorage(pdfDoc, fileName);
      
      if (!pdfUrl) {
        throw new Error("Failed to get PDF URL from storage");
      }
      
      // Save report data to the database
      reportId = await saveReportData(lead, pdfUrl);
      
      if (!reportId) {
        throw new Error("Failed to save report data to database");
      }
      
      success = true;
      console.log("Report saved successfully:", { reportId, pdfUrl });
    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error);
      
      // If this was the last attempt, show an error
      if (attempts >= maxRetries) {
        toast({
          title: "Error Saving Report",
          description: "We couldn't save your report. Please try again later.",
          variant: "destructive",
        });
      }
      
      // Wait briefly before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { reportId, pdfUrl };
}
