
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/leads";
import { jsPDF } from "jspdf";
import { ReportGenerationResult } from "./types";
import { toast } from "@/components/ui/use-toast";
import { verifyReportsBucket } from "./bucketUtils";
import { saveReportData, checkUserAuthentication } from "./databaseUtils";
import { savePDFToStorage } from "./fileUtils";
import { convertPDFToBlob } from "./pdfUtils";

/**
 * Improved function to save reports to storage with retry logic
 * Uses a different approach to bypass auth issues
 */
export async function saveReportToStorageWithRetry(
  lead: Lead, 
  pdfDoc: jsPDF, 
  retries = 3
): Promise<ReportGenerationResult> {
  try {
    console.log("Saving front-end report to storage for lead:", lead.id);
    
    // First ensure the lead ID is a valid UUID (not temp)
    if (!lead.id || lead.id.startsWith('temp-')) {
      const newLeadId = crypto.randomUUID();
      console.log(`Replacing invalid lead ID: ${lead.id} with valid UUID: ${newLeadId}`);
      lead.id = newLeadId;
    }
    
    // Check user authentication
    const { session } = await checkUserAuthentication();
    
    if (!session) {
      console.error("User is not authenticated - trying to continue with public access");
      // We can still try to generate the PDF for download even if we can't save to storage
      toast({
        title: "Authentication Notice",
        description: "Report will be generated for download only as you're not logged in",
        variant: "default"
      });
      // We'll continue to generate PDF for download even if we can't save to storage
    }
    
    // Verify the bucket is accessible
    const bucketAccessible = await verifyReportsBucket();
    if (!bucketAccessible) {
      toast({
        title: "Storage Error",
        description: "Reports storage is not accessible - report will be available for download only",
        variant: "default"
      });
      return {
        success: false,
        message: "Reports bucket is not accessible - check Supabase storage permissions",
        reportId: undefined
      };
    }
    
    // If not authenticated, still allow PDF generation but don't try to save to DB
    if (!session) {
      // Just return success with no storage
      const pdfBlob = await convertPDFToBlob(pdfDoc);
      if (!pdfBlob || pdfBlob.size === 0) {
        return {
          success: false,
          message: "Failed to generate valid PDF",
          reportId: undefined
        };
      }
      
      return {
        success: true,
        message: "Report generated for download only (not logged in)",
        reportId: undefined
      };
    }
    
    // Save report data to DB to get reportId
    const reportId = await saveReportData(lead);
    if (!reportId) {
      return {
        success: false,
        message: "Failed to save report data to database"
      };
    }
    
    // Convert PDF to blob for storage
    const pdfBlob = await convertPDFToBlob(pdfDoc);
    console.log("PDF converted to blob, size:", pdfBlob.size, "bytes");
    
    if (!pdfBlob || pdfBlob.size === 0) {
      console.error("Invalid PDF blob - empty or zero size");
      toast({
        title: "PDF Error",
        description: "Could not generate a valid PDF file",
        variant: "destructive"
      });
      return {
        success: false,
        message: "Generated PDF is invalid or empty",
        reportId
      };
    }
    
    // Upload PDF directly
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(`${reportId}.pdf`, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600'
      });
    
    if (error) {
      console.error("Error uploading PDF to storage:", error);
      
      // More detailed error analysis
      if (error.message.includes("row-level security policy")) {
        console.error("CRITICAL: RLS policy is preventing upload. You need to set the 'reports' bucket to public and configure proper RLS policies.");
        toast({
          title: "Permission Error",
          description: "Storage permissions preventing upload. Please contact support.",
          variant: "destructive"
        });
        return { 
          success: false, 
          message: `Storage permission denied: RLS policy is preventing upload`,
          reportId 
        };
      }
      
      if (error.message.includes("not authenticated")) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to upload files",
          variant: "destructive"
        });
      }
      
      toast({
        title: "Upload Error",
        description: "Failed to save PDF to storage. Report will be available for download only.",
        variant: "default"
      });
      
      return { 
        success: false, 
        message: `Storage upload failed: ${error.message}`,
        reportId 
      };
    }
    
    console.log("Upload successful, storage path:", data?.path);
    
    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(`${reportId}.pdf`);
    
    if (!urlData || !urlData.publicUrl) {
      return { 
        success: false, 
        message: "Failed to get public URL after upload",
        reportId 
      };
    }
    
    // Verify the URL works
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.warn(`Public URL check failed with status ${response.status}`);
        toast({
          title: "Warning",
          description: "Report was saved but may not be accessible online. It's still available for download.",
          variant: "default"
        });
      } else {
        console.log("Public URL verified accessible");
      }
    } catch (checkError) {
      console.warn("Error checking public URL:", checkError);
    }
    
    console.log("Successfully saved report to storage with URL:", urlData.publicUrl);
    
    toast({
      title: "Success",
      description: "Report successfully generated and saved",
      variant: "default"
    });
    
    return {
      success: true,
      message: "Report successfully generated and stored",
      reportId,
      pdfUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error(`Error in saveReportToStorageWithRetry (attempts left: ${retries}):`, error);
    
    toast({
      title: "Error",
      description: "Unexpected error saving report. Please try again.",
      variant: "destructive"
    });
    
    // Retry logic
    if (retries > 0) {
      console.log(`Retrying report storage (${retries} attempts left)...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return saveReportToStorageWithRetry(lead, pdfDoc, retries - 1);
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error in report storage",
      reportId: undefined
    };
  }
}
