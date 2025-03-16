
import { savePDFToStorage } from "./fileUtils";
import { saveReportData } from "./databaseUtils";
import { Lead } from "@/types/leads";
import { jsPDF } from "jspdf";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  
  // First check authentication
  const { data: authData } = await supabase.auth.getSession();
  const isAuthenticated = !!authData.session;
  
  if (!isAuthenticated) {
    console.error("User is not authenticated, cannot save to storage");
    if (isAdmin) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to save reports to storage. The report was downloaded locally.",
        variant: "destructive"
      });
    }
    return { reportId: null, pdfUrl: null };
  }
  
  while (attempts < maxRetries && !success) {
    attempts++;
    console.log(`Attempt ${attempts} of ${maxRetries} to save report...`);
    
    try {
      // First attempt to save the PDF to storage
      pdfUrl = await savePDFToStorage(pdfDoc, fileName, isAdmin);
      
      if (!pdfUrl) {
        console.error("Failed to get PDF URL from storage on attempt", attempts);
        throw new Error("Failed to get PDF URL from storage");
      }
      
      console.log(`✅ PDF saved to storage on attempt ${attempts}, URL:`, pdfUrl);
      
      // If PDF storage was successful, save the report data to the database
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
          description: "We couldn't save your report to the cloud. The report has been downloaded locally.",
          variant: "destructive",
        });
      }
      
      // Wait between retries with exponential backoff (starting with 1s, then 2s, then 4s)
      const delayMs = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
      console.log(`Waiting ${delayMs}ms before retry ${attempts + 1}...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  if (!success && isAdmin) {
    // If we weren't able to save to the cloud after all retries, notify the user that at least they have a local copy
    toast({
      title: "Report Downloaded",
      description: "The report has been downloaded to your device, but we couldn't save it to the cloud.",
      variant: "default"
    });
  }
  
  return { reportId, pdfUrl };
}
