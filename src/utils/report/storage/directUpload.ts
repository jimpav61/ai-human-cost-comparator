
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
    
    // 1. Use a simpler authentication approach (reverting to closer to original)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("DIRECT UPLOAD: Authentication error", error.message);
      if (!silent) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to save reports to cloud storage.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    // Check if session exists
    if (!data.session) {
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
    
    console.log("DIRECT UPLOAD: Authenticated with user ID", data.session.user.id);
    
    // 2. Quick bucket check - simplified
    const { data: bucketCheck, error: bucketError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    if (bucketError) {
      console.error("DIRECT UPLOAD: Cannot access reports bucket:", bucketError.message);
      if (!silent) {
        toast({
          title: "Storage Access Error",
          description: "Cannot access storage bucket. Report saved locally only.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    console.log("DIRECT UPLOAD: Bucket access confirmed, proceeding with upload");
    
    // 3. Upload with minimal options (closer to original working code)
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
    
    // 4. Get the public URL
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
