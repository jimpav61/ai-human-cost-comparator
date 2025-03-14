
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/leads";
import { convertPDFToBlob } from "./pdf/conversion";
import { ReportData } from "./types";
import { jsPDF } from "jspdf";
import { toast } from "@/hooks/use-toast";
import { getSafeFileName } from "./validation";

/**
 * Ensure the reports bucket exists, creating it if needed
 */
export const verifyReportsBucket = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error listing buckets:", error);
      throw error;
    }
    
    const reportsBucket = buckets.find(bucket => bucket.name === 'reports');
    
    if (!reportsBucket) {
      console.log("Reports bucket doesn't exist. Creating it...");
      
      const { error: createError } = await supabase.storage.createBucket('reports', {
        public: true,
        fileSizeLimit: 10485760 // 10MB limit
      });
      
      if (createError) {
        console.error("Error creating reports bucket:", createError);
        throw createError;
      }
      
      console.log("Reports bucket created successfully");
      
      // Set up public RLS policies for the bucket
      await setupPublicBucketPolicies();
    } else {
      console.log("Reports bucket already exists:", reportsBucket);
    }
    
    return true;
  } catch (error) {
    console.error("Error verifying reports bucket:", error);
    return false;
  }
};

/**
 * Set up public RLS policies for the reports bucket
 */
const setupPublicBucketPolicies = async () => {
  try {
    // Create test file to initialize permissions
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    await supabase.storage.from('reports').upload('test-permission.txt', testBlob);
    
    console.log("Created test file to initialize bucket permissions");
    return true;
  } catch (error) {
    console.error("Error setting up bucket policies:", error);
    return false;
  }
};

/**
 * Get a report file from storage by identifiers
 */
export const findReportInStorage = async (
  identifiers: string[]
): Promise<string | null> => {
  try {
    // List all files in the reports bucket
    const { data: files, error } = await supabase
      .storage
      .from('reports')
      .list();
      
    if (error) {
      console.error("Error listing files in reports bucket:", error);
      return null;
    }
    
    if (!files || files.length === 0) {
      console.log("No files found in reports bucket");
      return null;
    }
    
    console.log("Found files in reports bucket:", files.map(f => f.name));
    
    // Try to find a file that matches any of the provided identifiers
    for (const id of identifiers) {
      const matchingFile = files.find(file => file.name.includes(id));
      
      if (matchingFile) {
        console.log(`Found matching file using identifier '${id}':`, matchingFile.name);
        
        // Get the public URL
        const { data: urlData } = await supabase
          .storage
          .from('reports')
          .getPublicUrl(matchingFile.name);
          
        if (urlData?.publicUrl) {
          return urlData.publicUrl;
        }
      }
    }
    
    console.log("No matching files found with the provided identifiers");
    return null;
  } catch (error) {
    console.error("Error finding report in storage:", error);
    return null;
  }
};

/**
 * Check user authentication status
 */
export const checkUserAuthentication = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return { session, isAuthenticated: !!session };
};

/**
 * Save report data to the database
 */
export const saveReportData = async (lead: Lead): Promise<string | null> => {
  try {
    // Generate a unique ID for the report
    const reportId = crypto.randomUUID();
    
    // Make sure lead has valid ID
    if (!lead.id || typeof lead.id !== 'string') {
      console.error("Invalid lead ID");
      return null;
    }

    // Prepare report data 
    const reportData: ReportData = {
      id: reportId,
      lead_id: lead.id,
      company_name: lead.company_name || "Unknown Company",
      contact_name: lead.name || "Unknown Contact",
      email: lead.email || "unknown@example.com",
      phone_number: lead.phone_number || null,
      calculator_inputs: lead.calculator_inputs,
      calculator_results: lead.calculator_results,
      report_date: new Date().toISOString()
    };

    console.log("Saving report data to database:", reportData);

    // Insert into generated_reports table
    const { data, error } = await supabase
      .from('generated_reports')
      .insert(reportData)
      .select('id')
      .single();

    if (error) {
      console.error("Error saving report to database:", error);
      return null;
    }

    console.log("Report saved to database with ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Error in saveReportData:", error);
    return null;
  }
};

/**
 * Save PDF to Supabase storage
 */
export const savePDFToStorage = async (reportId: string, pdfBlob: Blob): Promise<string | null> => {
  try {
    console.log("Saving PDF to storage for report ID:", reportId);
    
    // Check if blob is valid
    if (!pdfBlob || pdfBlob.size === 0) {
      console.error("Invalid PDF blob provided");
      return null;
    }
    
    console.log("PDF blob size:", pdfBlob.size, "bytes");
    
    // The file path in storage
    const filePath = `${reportId}.pdf`;
    
    // Upload the PDF to Supabase storage
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
        cacheControl: '3600'
      });
    
    if (error) {
      console.error("Failed to upload PDF to storage:", error);
      
      // Add specific error handling for common issues
      if (error.message.includes("not found")) {
        console.error("CRITICAL: Bucket 'reports' not found. Create it in Supabase dashboard");
      } else if (error.message.includes("row-level security policy")) {
        console.error("CRITICAL: RLS policy is preventing upload. Make the bucket public");
      }
      
      return null;
    }
    
    console.log("Upload successful, data path:", data?.path);
    
    // Get the public URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      console.error("Failed to get public URL for PDF");
      return null;
    }
    
    console.log("PDF saved to storage with URL:", urlData.publicUrl);
    
    // Verify URL is accessible
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log("URL is accessible");
      } else {
        console.error(`URL returned status ${response.status}`);
      }
    } catch (error) {
      console.error("Error checking URL accessibility:", error);
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error saving PDF to storage:", error);
    return null;
  }
};

/**
 * Save a report to storage with retry capability
 */
export const saveReportToStorageWithRetry = async (
  lead: Lead, 
  pdfDoc: jsPDF, 
  maxRetries: number = 3
): Promise<{ success: boolean; message: string; reportId?: string; }> => {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Check authentication
      const { session } = await checkUserAuthentication();
      
      if (!session) {
        return { success: false, message: "User not authenticated" };
      }
      
      // Save report data to database
      const reportId = await saveReportData(lead);
      
      if (!reportId) {
        throw new Error("Failed to save report data to database");
      }
      
      // Convert PDF to blob
      const pdfBlob = await convertPDFToBlob(pdfDoc);
      
      // Save PDF to storage
      const pdfUrl = await savePDFToStorage(reportId, pdfBlob);
      
      if (!pdfUrl) {
        throw new Error("Failed to save PDF to storage");
      }
      
      return {
        success: true,
        message: "Report saved successfully",
        reportId
      };
    } catch (error) {
      retryCount++;
      console.error(`Error saving report (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount >= maxRetries) {
        return {
          success: false,
          message: `Failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`
        };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
  
  return {
    success: false,
    message: "Failed to save report after maximum retry attempts"
  };
};
