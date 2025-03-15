
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { convertPDFToBlob } from "./pdf/conversion";
import { jsPDF } from "jspdf";
import { verifyReportsBucket } from "./bucketUtils";

/**
 * Save a PDF file to Supabase storage
 * @param pdfDoc The PDF document to save
 * @param fileName The name to save the file as
 * @returns URL to the saved file or null if there was an error
 */
export async function savePDFToStorage(pdfDoc: jsPDF, fileName: string, isAdmin: boolean = false): Promise<string | null> {
  try {
    console.log("Starting PDF storage process for", fileName);
    
    // Make sure reports bucket exists with retry logic
    let bucketExists = false;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (!bucketExists && retryCount < maxRetries) {
      bucketExists = await verifyReportsBucket();
      if (!bucketExists) {
        console.log(`Bucket verification attempt ${retryCount + 1} failed, retrying...`);
        retryCount++;
        
        // Attempt to explicitly create the bucket
        try {
          const { data, error } = await supabase.storage.createBucket('reports', {
            public: true,
            fileSizeLimit: 10485760
          });
          
          if (error) {
            console.error(`STORAGE ERROR: Failed to create bucket on attempt ${retryCount}:`, error);
          } else {
            console.log(`STORAGE SUCCESS: Created bucket on attempt ${retryCount}:`, data);
            bucketExists = true;
          }
        } catch (createErr) {
          console.error(`STORAGE ERROR: Error creating bucket on attempt ${retryCount}:`, createErr);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Short delay before retry
      }
    }
    
    if (!bucketExists) {
      console.error("Failed to verify or create reports bucket after retries");
      
      // Check authenticated state
      const { data: sessionData } = await supabase.auth.getSession();
      console.error("STORAGE CRITICAL: Authentication state:", !!sessionData.session);
      
      // List all available buckets for debugging
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.error("STORAGE CRITICAL: Available buckets:", buckets);
      console.error("STORAGE CRITICAL: Buckets list error:", bucketsError);
      
      if (isAdmin) {
        toast({
          title: "Storage Error",
          description: "Unable to access storage. Your report was downloaded locally but not saved to the cloud.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    console.log("✅ Reports bucket verified successfully");
    
    // First convert the PDF to a blob
    const pdfBlob = await convertPDFToBlob(pdfDoc);
    console.log("PDF converted to blob, size:", pdfBlob.size);
    
    // Upload the file to Supabase storage with a simpler filename
    // CRITICAL FIX: Use a simpler filename without timestamping to prevent path issues
    const filePath = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Debug logging to verify the upload parameters
    console.log("Uploading to path:", filePath);
    console.log("Bucket:", 'reports');
    
    // Add retry logic for upload
    let uploadSuccess = false;
    let uploadAttempt = 0;
    let uploadData = null;
    let uploadError = null;
    
    while (!uploadSuccess && uploadAttempt < 3) {
      try {
        const { data, error } = await supabase.storage
          .from('reports')
          .upload(filePath, pdfBlob, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: true // Allow overwriting existing files
          });
        
        if (error) {
          console.error(`Upload attempt ${uploadAttempt + 1} failed:`, error);
          uploadError = error;
          uploadAttempt++;
          
          if (error.message.includes("storage/bucket-not-found") || error.message.includes("does not exist")) {
            // The bucket doesn't exist, try to create it again
            try {
              const { data: newBucket, error: createError } = await supabase.storage.createBucket('reports', {
                public: true,
                fileSizeLimit: 10485760
              });
              
              if (createError) {
                console.error("Failed to create bucket during upload retry:", createError);
              } else {
                console.log("Successfully created bucket during upload retry:", newBucket);
              }
            } catch (createErr) {
              console.error("Exception creating bucket during upload retry:", createErr);
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay before retry
        } else {
          uploadSuccess = true;
          uploadData = data;
          console.log(`✅ PDF successfully uploaded on attempt ${uploadAttempt + 1}:`, data);
        }
      } catch (err) {
        console.error(`Upload attempt ${uploadAttempt + 1} exception:`, err);
        uploadError = err;
        uploadAttempt++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay before retry
      }
    }
    
    if (!uploadSuccess) {
      console.error("All upload attempts failed:", uploadError);
      if (isAdmin) {
        toast({
          title: "Upload Failed",
          description: "Your report was downloaded locally but could not be saved to the cloud.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(filePath);
    
    console.log("Generated public URL:", urlData);
    
    // Verify file was saved by checking if URL is accessible
    try {
      const checkResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (checkResponse.ok) {
        console.log("✅ URL is accessible:", checkResponse.status);
        if (isAdmin) {
          toast({
            title: "Report Saved",
            description: "Your report was successfully saved to the cloud.",
            variant: "default"
          });
        }
      } else {
        console.warn("URL verification failed with status:", checkResponse.status);
      }
    } catch (err) {
      console.warn("Error checking URL accessibility:", err);
      // Continue anyway since this is just a verification step
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in savePDFToStorage:", error);
    return null;
  }
}
