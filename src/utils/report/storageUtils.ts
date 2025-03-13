
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { ReportData, ReportGenerationResult } from "./types";
import { convertPDFToBlob } from "./pdfUtils";
import { toJson } from "@/hooks/calculator/supabase-types";

/**
 * Verify the reports bucket exists and is accessible
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying 'reports' bucket is accessible...");
    
    // Check if the bucket exists by trying to access it
    const { data, error } = await supabase.storage.getBucket('reports');
    
    if (error) {
      console.error("Error verifying 'reports' bucket:", error);
      
      // Additional debug info about error type
      if (error.message.includes("row-level security policy")) {
        console.error("CRITICAL: RLS policy is preventing bucket access");
      }
      
      return false;
    }
    
    console.log("Successfully verified 'reports' bucket exists with settings:", data);
    
    // Bucket exists and is accessible
    return true;
  } catch (error) {
    console.error("Unexpected error verifying 'reports' bucket:", error);
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
      company_name: lead.company_name,
      contact_name: lead.name,
      email: lead.email,
      phone_number: lead.phone_number || null,
      calculator_inputs: toJson(lead.calculator_inputs),
      calculator_results: toJson(lead.calculator_results),
      report_date: new Date().toISOString(),
      version: 1 // Default to version 1
    };

    console.log("Saving report data:", reportData);

    // Save to database
    const { data, error } = await supabase
      .from('generated_reports')
      .insert(reportData)
      .select('id')
      .single();

    if (error) {
      console.error("Failed to save report to database:", error);
      return null;
    }

    console.log("Report saved to database with ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Unexpected error saving report:", error);
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
      console.error("Cannot save PDF - reports bucket is not accessible");
      return null;
    }
    
    // The file path in storage
    const filePath = `${reportId}.pdf`;
    
    console.log("Uploading to bucket 'reports' with path:", filePath);
    console.log("PDF Blob size:", pdfBlob.size, "bytes");
    
    // Ensure PDF blob is valid
    if (!pdfBlob || pdfBlob.size === 0) {
      console.error("Invalid PDF blob - empty or missing");
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
      } else if (error.message.includes("bucket") && error.message.includes("not found")) {
        console.error("CRITICAL: Bucket 'reports' does not exist - it must be created in the Supabase dashboard");
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
      return null;
    }
    
    console.log("PDF saved to storage with URL:", urlData.publicUrl);
    
    // Verify the URL is accessible
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error(`PDF URL check failed with status ${response.status}`);
      } else {
        console.log("PDF URL was successfully verified as accessible");
      }
    } catch (checkError) {
      console.error("Error verifying PDF URL:", checkError);
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Unexpected error saving PDF to storage:", error);
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
    
    // Verify the bucket is accessible
    const bucketAccessible = await verifyReportsBucket();
    if (!bucketAccessible) {
      return {
        success: false,
        message: "Reports bucket is not accessible - check Supabase storage permissions"
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
        return { 
          success: false, 
          message: `Storage permission denied: RLS policy is preventing upload`,
          reportId 
        };
      }
      
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
      } else {
        console.log("Public URL verified accessible");
      }
    } catch (checkError) {
      console.warn("Error checking public URL:", checkError);
    }
    
    console.log("Successfully saved report to storage with URL:", urlData.publicUrl);
    
    return {
      success: true,
      message: "Report successfully generated and stored",
      reportId,
      pdfUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error(`Error in saveReportToStorageWithRetry (attempts left: ${retries}):`, error);
    
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
