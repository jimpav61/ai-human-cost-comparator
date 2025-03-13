
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { ReportData, ReportGenerationResult } from "./types";
import { convertPDFToBlob } from "./pdfUtils";
import { toJson } from "@/hooks/calculator/supabase-types";
import { toast } from "@/components/ui/use-toast";

/**
 * Verify the reports bucket exists and is accessible
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying 'reports' bucket is accessible...");
    
    // Check if the bucket exists by trying to list files in it
    const { data, error } = await supabase.storage.from('reports').list();
    
    if (error) {
      console.error("Error accessing 'reports' bucket:", error);
      
      // Additional debug info about error type
      if (error.message.includes("row-level security policy")) {
        console.error("CRITICAL: RLS policy is preventing bucket access. Please check the Supabase storage bucket 'reports' has proper RLS policies.");
        toast({
          title: "Storage Access Error",
          description: "Unable to access reports storage due to permission issues. Please contact support.",
          variant: "destructive"
        });
      } else if (error.message.includes("does not exist")) {
        console.error("CRITICAL: The 'reports' bucket does not exist. Please create it in the Supabase dashboard.");
        toast({
          title: "Storage Configuration Error",
          description: "The reports storage bucket does not exist. Please contact support.",
          variant: "destructive"
        });
      }
      
      return false;
    }
    
    console.log("Successfully verified 'reports' bucket exists and is accessible. Files count:", data?.length);
    
    // Bucket exists and is accessible
    return true;
  } catch (error) {
    console.error("Unexpected error verifying 'reports' bucket:", error);
    toast({
      title: "Storage Error",
      description: "Unexpected error accessing storage. Please try again later.",
      variant: "destructive"
    });
    return false;
  }
}

/**
 * Save report data to the database
 */
export async function saveReportData(lead: Lead): Promise<string | null> {
  try {
    // Generate a new UUID for the report
    const reportId = crypto.randomUUID();
    
    // Ensure the lead ID is valid UUID
    if (!lead.id || lead.id.startsWith('temp-')) {
      console.warn(`Invalid lead ID format detected: ${lead.id}, this may cause issues with storage references`);
      lead.id = crypto.randomUUID();
      console.log(`Assigned new valid UUID to lead: ${lead.id}`);
    }
    
    // Prepare report data
    const reportData: ReportData = {
      id: reportId,
      lead_id: lead.id,
      company_name: lead.company_name || "Unknown Company",
      contact_name: lead.name || "Unknown Contact",
      email: lead.email || "unknown@example.com",
      phone_number: lead.phone_number || null,
      calculator_inputs: toJson(lead.calculator_inputs),
      calculator_results: toJson(lead.calculator_results),
      report_date: new Date().toISOString(),
      version: 1 // Default to version 1
    };

    console.log("Saving report data:", reportData);

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      console.error("User is not authenticated - report data cannot be saved to database");
      toast({
        title: "Authentication Required",
        description: "You must be logged in to save report data",
        variant: "destructive"
      });
      return null;
    }

    // Save to database
    const { data, error } = await supabase
      .from('generated_reports')
      .insert(reportData)
      .select('id')
      .single();

    if (error) {
      console.error("Failed to save report to database:", error);
      toast({
        title: "Database Error",
        description: "Failed to save report data. Please try again.",
        variant: "destructive"
      });
      return null;
    }

    console.log("Report saved to database with ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Unexpected error saving report:", error);
    toast({
      title: "Error",
      description: "Unexpected error saving report data. Please try again.",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Save PDF to Supabase storage and return the URL
 */
export async function savePDFToStorage(reportId: string, pdfBlob: Blob): Promise<string | null> {
  try {
    console.log("Saving PDF to storage for report ID:", reportId);
    
    // Verify the bucket is accessible before attempting upload
    const bucketAccessible = await verifyReportsBucket();
    if (!bucketAccessible) {
      console.error("Cannot save PDF - reports bucket is not accessible. Please check your Supabase storage configuration.");
      toast({
        title: "Storage Error",
        description: "Unable to access storage. Please try again later.",
        variant: "destructive"
      });
      return null;
    }
    
    // Check authentication before uploading
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      console.error("User is not authenticated - cannot upload PDF to storage");
      toast({
        title: "Authentication Required",
        description: "You must be logged in to upload files",
        variant: "destructive"
      });
      return null;
    }
    
    // The file path in storage
    const filePath = `${reportId}.pdf`;
    
    console.log("Uploading to bucket 'reports' with path:", filePath);
    console.log("PDF Blob size:", pdfBlob.size, "bytes");
    
    // Ensure PDF blob is valid
    if (!pdfBlob || pdfBlob.size === 0) {
      console.error("Invalid PDF blob - empty or missing");
      toast({
        title: "Report Error",
        description: "Could not generate a valid PDF file",
        variant: "destructive"
      });
      return null;
    }
    
    // Upload the PDF to Supabase storage
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600'
      });
    
    if (error) {
      console.error("Failed to upload PDF to storage:", error);
      
      // Add more detailed error diagnostics
      if (error.message.includes("row-level security policy")) {
        console.error("CRITICAL: RLS policy is preventing upload - check Supabase storage bucket permissions");
        console.error("Ensure the 'reports' bucket has RLS policies allowing uploads from authenticated users");
        toast({
          title: "Permission Error",
          description: "Storage permissions preventing upload. Please contact support.",
          variant: "destructive"
        });
      } else if (error.message.includes("bucket") && error.message.includes("not found")) {
        console.error("CRITICAL: Bucket 'reports' does not exist - it must be created in the Supabase dashboard");
        toast({
          title: "Configuration Error",
          description: "Storage bucket does not exist. Please contact support.",
          variant: "destructive"
        });
      } else if (error.message.includes("not authenticated")) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to upload files",
          variant: "destructive"
        });
      }
      
      return null;
    }
    
    console.log("Upload successful, data:", data);
    
    // Get the public URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      console.error("Failed to get public URL for PDF");
      toast({
        title: "Storage Error",
        description: "Could not retrieve file URL after upload",
        variant: "destructive"
      });
      return null;
    }
    
    console.log("PDF saved to storage with URL:", urlData.publicUrl);
    
    // Verify the URL is accessible
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error(`PDF URL check failed with status ${response.status}`);
        toast({
          title: "Warning",
          description: "Report was saved but may not be accessible. Please try downloading again.",
          variant: "destructive"
        });
      } else {
        console.log("PDF URL was successfully verified as accessible");
      }
    } catch (checkError) {
      console.error("Error verifying PDF URL:", checkError);
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Unexpected error saving PDF to storage:", error);
    toast({
      title: "Upload Error",
      description: "Unexpected error uploading file. Please try again.",
      variant: "destructive"
    });
    return null;
  }
}

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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
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
