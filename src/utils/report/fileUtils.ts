
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { convertPDFToBlob } from "./pdf/conversion";
import { jsPDF } from "jspdf";

/**
 * Save a PDF file to Supabase storage
 * @param pdfDoc The PDF document to save
 * @param fileName The name to save the file as
 * @returns URL to the saved file or null if there was an error
 */
export async function savePDFToStorage(pdfDoc: jsPDF, fileName: string, isAdmin: boolean = false): Promise<string | null> {
  try {
    console.log("Starting PDF storage process for", fileName);
    
    // First check if user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error("Authentication error:", authError.message);
      if (isAdmin) {
        toast({
          title: "Authentication Error",
          description: "Session verification failed. The report was downloaded locally.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    if (!authData.session) {
      console.error("User is not authenticated, cannot save to storage");
      if (isAdmin) {
        toast({
          title: "Authentication Required",
          description: "You need to be logged in to save reports to storage. The report was downloaded locally.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    console.log("User authenticated with ID:", authData.session.user.id);
    
    // First convert the PDF to a blob
    const pdfBlob = await convertPDFToBlob(pdfDoc);
    console.log("PDF converted to blob, size:", pdfBlob.size);
    
    // Make sure the reports bucket exists before uploading
    try {
      // First check if bucket exists by listing buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Error checking buckets:", bucketsError);
      } else {
        const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports') || false;
        console.log("Reports bucket exists:", reportsBucketExists);
        
        // If reports bucket doesn't exist, create it
        if (!reportsBucketExists) {
          console.log("Reports bucket not found, creating it...");
          
          try {
            const { data: createData, error: createError } = await supabase.storage
              .createBucket('reports', { 
                public: true,
                fileSizeLimit: 10485760 // 10MB limit
              });
              
            if (createError) {
              console.error("Failed to create reports bucket:", createError);
              // Try to continue anyway - bucket might exist but we can't see it
            } else {
              console.log("Successfully created reports bucket");
            }
          } catch (createError) {
            console.error("Error creating bucket:", createError);
            // Continue anyway - the bucket might exist despite the error
          }
        }
      }
    } catch (bucketCheckError) {
      console.error("Error checking/creating buckets:", bucketCheckError);
      // Try to continue anyway
    }
    
    // Use a simpler filename to prevent path issues, with timestamp to avoid conflicts
    const timestamp = new Date().getTime();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${safeFileName}_${timestamp}.pdf`;
    
    console.log("Uploading to path:", filePath);
    console.log("Bucket:", 'reports');
    
    // Upload with explicit content type to ensure proper handling
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
      });
    
    if (error) {
      console.error("Storage upload error:", error.message);
      console.error("Error details:", error);
      
      // Additional diagnostic information
      if (error.message.includes("storage/object-not-found")) {
        console.error("The path might be invalid");
      } else if (error.message.includes("Permission denied")) {
        console.error("User lacks permission to upload to the reports bucket");
        
        // Try again with a super simple configuration
        console.log("Attempting simplified upload as fallback...");
        const fallbackFilePath = `report_${timestamp}.pdf`;
        
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('reports')
          .upload(fallbackFilePath, pdfBlob, { 
            upsert: true 
          });
          
        if (!fallbackError) {
          console.log("Fallback upload succeeded!");
          // Get URL for the fallback file
          const { data: fallbackUrlData } = await supabase.storage
            .from('reports')
            .getPublicUrl(fallbackFilePath);
            
          if (fallbackUrlData?.publicUrl) {
            console.log("Generated fallback public URL:", fallbackUrlData.publicUrl);
            return fallbackUrlData.publicUrl;
          }
        } else {
          console.error("Fallback upload also failed:", fallbackError);
        }
      } else if (error.message.includes("not found")) {
        console.error("Bucket might not exist, detailed error:", error);
        
        // Additional debug - check what buckets are available
        try {
          const { data: availableBuckets } = await supabase.storage.listBuckets();
          console.log("Available buckets:", availableBuckets);
        } catch (listError) {
          console.error("Unable to list buckets:", listError);
        }
      }
      
      if (isAdmin) {
        toast({
          title: "Upload Failed",
          description: `Your report was downloaded locally but could not be saved to the cloud. Error: ${error.message}`,
          variant: "destructive"
        });
      }
      return null;
    }
    
    console.log("✅ PDF successfully uploaded:", data);
    
    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(filePath);
    
    if (!urlData?.publicUrl) {
      console.error("Failed to generate public URL");
      return null;
    }
    
    console.log("Generated public URL:", urlData.publicUrl);
    
    if (isAdmin) {
      toast({
        title: "Report Saved",
        description: "Your report was successfully saved to the cloud.",
        variant: "default"
      });
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in savePDFToStorage:", error);
    return null;
  }
}
