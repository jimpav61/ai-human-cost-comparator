
import { savePDFToStorage } from "./fileUtils";
import { saveReportData } from "./databaseUtils";
import { Lead } from "@/types/leads";
import { jsPDF } from "jspdf";
import { toast } from "@/hooks/use-toast";

/**
 * Save a report to storage with retry mechanism
 */
export async function saveReportToStorageWithRetry(
  pdfDoc: jsPDF,
  lead: Lead,
  fileName: string,
  maxRetries: number = 3,
  isAdmin: boolean = false
): Promise<{ reportId: string | null; pdfUrl: string | null }> {
  let attempts = 0;
  let success = false;
  let pdfUrl: string | null = null;
  let reportId: string | null = null;
  
  console.log("Starting report save with retry mechanism");
  
  while (attempts < maxRetries && !success) {
    attempts++;
    console.log(`Attempt ${attempts} of ${maxRetries} to save report...`);
    
    try {
      // Save PDF to storage with progressively longer delays between retries
      pdfUrl = await savePDFToStorage(pdfDoc, fileName, isAdmin);
      
      if (!pdfUrl) {
        console.error("Failed to get PDF URL from storage on attempt", attempts);
        throw new Error("Failed to get PDF URL from storage");
      }
      
      console.log(`✅ PDF saved to storage on attempt ${attempts}, URL:`, pdfUrl);
      
      // Save report data to the database
      reportId = await saveReportData(lead, pdfUrl);
      
      if (!reportId) {
        console.error("Failed to save report data to database on attempt", attempts);
        throw new Error("Failed to save report data to database");
      }
      
      console.log(`✅ Report data saved to database on attempt ${attempts}, ID:`, reportId);
      
      success = true;
    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error);
      
      if (attempts >= maxRetries && isAdmin) {
        toast({
          title: "Error Saving Report",
          description: "We couldn't save your report to the cloud. Please try again later.",
          variant: "destructive",
        });
      }
      
      // Wait between retries with exponential backoff
      const delayMs = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return { reportId, pdfUrl };
}
