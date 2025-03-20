
import { savePDFToStorage } from "./fileUtils";
import { saveReportData } from "./databaseUtils";
import { Lead } from "@/types/leads";
import { jsPDF } from "jspdf";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { uploadPDFToBucket } from "./storage/directUpload";
import { convertPDFToBlob } from "./pdf/conversion";

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
  console.log(`Lead ID: ${lead.id}`);
  console.log(`Lead company name: ${lead.company_name}`);
  console.log(`Provided filename: ${fileName}`);
  
  // First check authentication - using the same proven pattern from directUpload.ts
  const { data: authData, error: authError } = await supabase.auth.getSession();
  
  if (authError) {
    console.error(`Authentication error: ${authError.message}`);
    if (isAdmin) {
      toast({
        title: "Authentication Error",
        description: "Session verification failed. The report was downloaded locally.",
        variant: "destructive"
      });
    }
    return { reportId: null, pdfUrl: null };
  }
  
  const isAuthenticated = !!authData.session;
  
  // Enhanced session logging
  if (isAuthenticated) {
    console.log(`User authenticated with ID: ${authData.session.user.id}`);
    console.log(`Token expires at: ${new Date(authData.session.expires_at! * 1000).toISOString()}`);
  } else {
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
  
  // Ensure the lead ID exists
  if (!lead.id) {
    console.error("Lead ID is missing, generating temporary ID");
    lead.id = uuidv4();
  }
  
  // CRITICAL: ALWAYS use standardized UUID format for filenames
  // Using lead.id ensures unique filenames for each lead, even with same company info
  const standardFileName = `${lead.id}.pdf`;
  console.log(`Standardizing filename to UUID-based format: ${standardFileName}`);
  
  // First convert the PDF to a blob for upload
  const pdfBlob = await convertPDFToBlob(pdfDoc);
  
  while (attempts < maxRetries && !success) {
    attempts++;
    console.log(`Attempt ${attempts} of ${maxRetries} to save report...`);
    
    try {
      // Use our proven direct upload utility to save the PDF to storage
      pdfUrl = await uploadPDFToBucket(standardFileName, pdfBlob, !isAdmin);
      
      if (!pdfUrl) {
        console.error(`Failed to get PDF URL from storage on attempt ${attempts}`);
        throw new Error("Failed to get PDF URL from storage");
      }
      
      console.log(`✅ PDF saved to storage on attempt ${attempts}, URL: ${pdfUrl}`);
      
      // If PDF storage was successful, save the report data to the database
      reportId = await saveReportData(lead, pdfUrl);
      
      if (!reportId) {
        console.error(`Failed to save report data to database on attempt ${attempts}`);
        throw new Error("Failed to save report data to database");
      }
      
      console.log(`✅ Report data saved to database on attempt ${attempts}, ID: ${reportId}`);
      
      success = true;
    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error);
      
      if (attempts >= maxRetries && isAdmin) {
        toast({
          title: "Error Saving Report",
          description: "We couldn't save your report to the cloud after multiple attempts. The report has been downloaded locally.",
          variant: "destructive",
        });
      }
      
      // Wait between retries with exponential backoff
      const delayMs = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
      console.log(`Waiting ${delayMs}ms before retry ${attempts + 1}...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  if (success) {
    console.log(`Successfully saved report after ${attempts} attempts`);
    console.log(`Report ID: ${reportId}`);
    console.log(`PDF URL: ${pdfUrl}`);
    
    if (isAdmin) {
      toast({
        title: "Report Saved",
        description: "The report has been successfully saved to the cloud.",
        variant: "default"
      });
    }
  } else {
    console.error(`Failed to save report after ${maxRetries} attempts`);
    
    if (isAdmin) {
      toast({
        title: "Report Downloaded",
        description: "The report has been downloaded to your device, but we couldn't save it to the cloud after multiple attempts.",
        variant: "default"
      });
    }
  }
  
  return { reportId, pdfUrl };
}
