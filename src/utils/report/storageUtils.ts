
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { ReportData, ReportGenerationResult } from "./types";
import { convertPDFToBlob } from "./pdfUtils";
import { toJson } from "@/hooks/calculator/supabase-types";

/**
 * Create or get the reports bucket, ensuring it exists and is properly configured
 */
export async function createOrGetReportsBucket(): Promise<boolean> {
  try {
    console.log("Checking if 'reports' bucket exists...");
    
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }
    
    const reportsBucket = buckets?.find(bucket => bucket.name === 'reports');
    
    if (reportsBucket) {
      console.log("'reports' bucket already exists");
      return true;
    }
    
    // Bucket doesn't exist, try to create it
    console.log("'reports' bucket doesn't exist. Creating...");
    const { data, error } = await supabase.storage.createBucket('reports', {
      public: true,
      fileSizeLimit: 10485760 // 10MB limit
    });
    
    if (error) {
      console.error("Failed to create 'reports' bucket:", error);
      throw new Error(`Failed to create reports bucket: ${error.message}`);
    }
    
    console.log("Successfully created 'reports' bucket");
    
    // Wait a moment to ensure the bucket is registered
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Make another API call to confirm bucket exists
    const { data: checkData, error: checkError } = await supabase.storage.getBucket('reports');
    
    if (checkError) {
      console.error("Error confirming bucket creation:", checkError);
      return false;
    } else {
      console.log("Bucket creation confirmed:", checkData);
      return true;
    }
    
  } catch (error) {
    console.error("Error in createOrGetReportsBucket:", error);
    // Log the error but return false to indicate failure
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
    
    // Ensure the bucket exists
    const bucketExists = await createOrGetReportsBucket();
    if (!bucketExists) {
      console.error("Cannot save PDF - reports bucket creation failed");
      return null;
    }
    
    // The file path in storage
    const filePath = `${reportId}.pdf`;
    
    console.log("Uploading to bucket 'reports' with path:", filePath);
    console.log("PDF Blob size:", pdfBlob.size, "bytes");
    
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
    
    // First ensure the reports bucket exists
    const bucketExists = await createOrGetReportsBucket();
    if (!bucketExists) {
      return {
        success: false,
        message: "Failed to create or verify reports bucket"
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
