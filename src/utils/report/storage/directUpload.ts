
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Direct upload utility for storing PDF files to Supabase storage
 * Uses a simplified approach with consistent error handling
 */
export async function uploadPDFToBucket(
  fileName: string, 
  pdfBlob: Blob, 
  silent: boolean = false
): Promise<string | null> {
  try {
    console.log("DIRECT UPLOAD: Starting upload of", fileName, "to reports bucket");
    
    // Using the simplest authentication approach that worked before
    const { data: authData } = await supabase.auth.getSession();
    
    if (!authData.session) {
      console.error("DIRECT UPLOAD: No active session found");
      if (!silent) {
        toast({
          title: "Authentication Required",
          description: "You need to be logged in to save reports to storage.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    console.log("DIRECT UPLOAD: Authenticated with user ID", authData.session.user.id);
    
    // Perform direct file upload with minimal options
    console.log("DIRECT UPLOAD: Uploading file", fileName, "size:", pdfBlob.size);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error("DIRECT UPLOAD: Upload failed with error:", uploadError.message);
      
      if (!silent) {
        toast({
          title: "Upload Failed",
          description: "Could not save report to cloud storage.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    console.log("DIRECT UPLOAD: Upload successful, getting public URL");
    
    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(fileName);
    
    if (!urlData?.publicUrl) {
      console.error("DIRECT UPLOAD: Could not get public URL");
      return null;
    }
    
    console.log("DIRECT UPLOAD: Successfully uploaded file with URL:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("DIRECT UPLOAD: Unexpected error in upload process:", error);
    return null;
  }
}
