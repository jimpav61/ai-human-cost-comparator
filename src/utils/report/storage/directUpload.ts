
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
    
    // 1. Get a fresh session token to ensure authentication is current
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("DIRECT UPLOAD: Session retrieval error", sessionError.message);
      if (!silent) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to save reports to cloud storage.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    if (!sessionData.session) {
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
    
    console.log("DIRECT UPLOAD: Authenticated with user ID", sessionData.session.user.id);
    console.log("DIRECT UPLOAD: Session expires at", new Date(sessionData.session.expires_at * 1000).toISOString());
    
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
    
    // 3. Upload with more detailed logging for authentication troubleshooting
    console.log("DIRECT UPLOAD: Uploading file", fileName, "size:", pdfBlob.size);
    console.log("DIRECT UPLOAD: Upload started at:", new Date().toISOString());
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.error("DIRECT UPLOAD: Upload failed with error:", uploadError.message);
      console.error("DIRECT UPLOAD: Error details:", uploadError);
      
      // Check for specific error types to provide better feedback
      if (uploadError.message.includes("Permission") || uploadError.message.includes("denied") || uploadError.message.includes("401")) {
        console.error("DIRECT UPLOAD: Permission issue when uploading - authentication problem");
        if (!silent) {
          toast({
            title: "Authentication Error",
            description: "Your login session may have expired. Please sign in again.",
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
