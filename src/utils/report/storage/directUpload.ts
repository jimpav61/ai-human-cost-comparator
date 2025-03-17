
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
    
    // 1. First verify authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError || !authData.session) {
      console.error("DIRECT UPLOAD: Authentication error", authError?.message);
      if (!silent) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to save reports to cloud storage.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    console.log("DIRECT UPLOAD: Authenticated with user ID", authData.session.user.id);
    
    // 2. Verify bucket accessibility with minimal check
    try {
      const { data: bucketFiles, error: listError } = await supabase.storage
        .from('reports')
        .list('', { limit: 1 });
      
      if (listError) {
        console.error("DIRECT UPLOAD: Cannot access reports bucket:", listError.message);
        if (!silent) {
          toast({
            title: "Storage Access Error",
            description: "Cannot access storage bucket. Report saved locally only.",
            variant: "destructive"
          });
        }
        return null;
      }
      
      console.log("DIRECT UPLOAD: Successfully verified bucket access");
    } catch (bucketError) {
      console.error("DIRECT UPLOAD: Exception checking bucket:", bucketError);
      return null;
    }
    
    // 3. Simplified upload process - single attempt with standardized options
    console.log("DIRECT UPLOAD: Uploading file", fileName, "size:", pdfBlob.size);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error("DIRECT UPLOAD: Upload failed with error:", uploadError.message);
      
      // Check for specific error types to provide better feedback
      if (uploadError.message.includes("Permission") || uploadError.message.includes("denied")) {
        console.error("DIRECT UPLOAD: Permission issue when uploading");
        if (!silent) {
          toast({
            title: "Permission Error",
            description: "You don't have permission to upload files to storage.",
            variant: "destructive"
          });
        }
      } else if (uploadError.message.includes("not found") || uploadError.message.includes("exist")) {
        console.error("DIRECT UPLOAD: Bucket not found");
        if (!silent) {
          toast({
            title: "Storage Error",
            description: "Reports storage bucket not found.",
            variant: "destructive"
          });
        }
      } else {
        console.error("DIRECT UPLOAD: General upload error");
        if (!silent) {
          toast({
            title: "Upload Failed",
            description: "Could not save report to cloud storage.",
            variant: "destructive"
          });
        }
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
    
    // 5. Verify the file exists by listing it to confirm upload
    const { data: verifyData, error: verifyError } = await supabase.storage
      .from('reports')
      .list('', { 
        search: fileName 
      });
    
    if (verifyError || !verifyData || !verifyData.find(f => f.name === fileName)) {
      console.error("DIRECT UPLOAD: File verification failed - could not confirm upload");
      return null;
    }
    
    console.log("DIRECT UPLOAD: File verified in storage listing");
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("DIRECT UPLOAD: Unexpected error in upload process:", error);
    return null;
  }
}
