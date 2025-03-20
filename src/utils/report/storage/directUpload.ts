
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Direct upload utility for storing PDF files to Supabase storage
 * Uses a proven authentication approach with improved logging
 */
export async function uploadPDFToBucket(
  fileName: string, 
  pdfBlob: Blob, 
  silent: boolean = false,
  retryCount: number = 0
): Promise<string | null> {
  try {
    console.log(`DIRECT UPLOAD [Attempt ${retryCount + 1}]: Starting upload of ${fileName} to reports bucket`);
    
    // Use the simple authentication approach that has been proven to work
    const { data: authData } = await supabase.auth.getSession();
    
    // Enhanced session logging to help track authentication issues
    if (authData.session) {
      console.log(`DIRECT UPLOAD: Authenticated with user ID ${authData.session.user.id}`);
      console.log(`DIRECT UPLOAD: Token expires at ${new Date(authData.session.expires_at! * 1000).toISOString()}`);
      
      // Check if token is about to expire (within 5 minutes)
      const expiresInSeconds = authData.session.expires_at! - Math.floor(Date.now() / 1000);
      if (expiresInSeconds < 300) {
        console.warn(`DIRECT UPLOAD: Token expires in only ${expiresInSeconds} seconds`);
      }
    } else {
      console.error("DIRECT UPLOAD: No active session found");
      
      // Retry once with a fresh session call if this is the first attempt
      if (retryCount === 0) {
        console.log("DIRECT UPLOAD: Retrying authentication once...");
        
        // Wait a moment before retry
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try again with incremented retry count
        return uploadPDFToBucket(fileName, pdfBlob, silent, retryCount + 1);
      }
      
      if (!silent) {
        toast({
          title: "Authentication Required",
          description: "You need to be logged in to save reports to storage.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    // Perform direct file upload with minimal options - the approach that worked
    console.log(`DIRECT UPLOAD: Uploading file ${fileName}, size: ${pdfBlob.size}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error(`DIRECT UPLOAD: Upload failed with error: ${uploadError.message}`);
      console.error(`DIRECT UPLOAD: Error details:`, uploadError);
      
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
    
    console.log(`DIRECT UPLOAD: Successfully uploaded file with URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error("DIRECT UPLOAD: Unexpected error in upload process:", error);
    return null;
  }
}
