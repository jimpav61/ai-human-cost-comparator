
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
    console.log("Starting PDF storage process for file:", fileName);
    
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
    
    // REMOVED: No longer attempting to create bucket here
    // Assume bucket exists, just verify we can access it
    try {
      // First check if bucket exists by listing buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Error checking buckets:", bucketsError);
      } else {
        const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports') || false;
        console.log("Reports bucket exists:", reportsBucketExists);
        
        if (!reportsBucketExists) {
          console.error("Reports bucket not found. Cannot save report.");
          if (isAdmin) {
            toast({
              title: "Storage Error",
              description: "Reports bucket not found. Your report was downloaded locally only.",
              variant: "destructive"
            });
          }
          return null;
        }
      }
    } catch (bucketCheckError) {
      console.error("Error checking buckets:", bucketCheckError);
      // Continue anyway, we'll see if the upload works
    }
    
    // Validate that fileName is in UUID.pdf format
    // This helps ensure consistency across the system
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;
    if (!fileName.match(uuidPattern)) {
      console.warn("WARNING: Filename does not appear to be in UUID.pdf format:", fileName);
      console.warn("This may cause storage verification issues. Proceeding with provided filename.");
    }
    
    console.log("Uploading to path:", fileName);
    console.log("Bucket:", 'reports');
    
    // Upload with explicit content type to ensure proper handling
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBlob, {
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
        
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('reports')
          .upload(fileName, pdfBlob, { 
            upsert: true 
          });
          
        if (!fallbackError) {
          console.log("Fallback upload succeeded!");
          // Get URL for the fallback file
          const { data: fallbackUrlData } = await supabase.storage
            .from('reports')
            .getPublicUrl(fileName);
            
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
      .getPublicUrl(fileName);
    
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
