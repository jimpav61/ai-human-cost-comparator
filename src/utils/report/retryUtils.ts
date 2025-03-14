
import { savePDFToStorage } from "./fileUtils";
import { saveReportData } from "./databaseUtils";
import { Lead } from "@/types/leads";
import { jsPDF } from "jspdf";
import { toast } from "@/hooks/use-toast";
import { verifyReportsBucket } from "./bucketUtils";

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
  
  // First, make sure the bucket exists with multiple verification attempts
  let bucketVerified = false;
  let bucketAttempts = 0;
  
  while (!bucketVerified && bucketAttempts < 2) {
    bucketVerified = await verifyReportsBucket();
    if (!bucketVerified) {
      console.log(`Bucket verification attempt ${bucketAttempts + 1} failed`);
      bucketAttempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  if (!bucketVerified) {
    console.error("Failed to verify or create reports bucket");
    if (isAdmin) {
      toast({
        title: "Storage Error",
        description: "Cloud storage is unavailable. Your report was downloaded locally only.",
        variant: "destructive"
      });
    }
    return { reportId: null, pdfUrl: null };
  }
  
  console.log("✅ Storage bucket verified before retry attempt");
  
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
      console.log("Report saved successfully:", { reportId, pdfUrl });
    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error);
      
      // If this was the last attempt, show an error
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
