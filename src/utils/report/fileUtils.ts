
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
    
    // Validate UUID format for consistency
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;
    if (!fileName.match(uuidPattern)) {
      console.warn("Non-UUID filename provided:", fileName);
      // Don't throw error, just log the warning
    }
    
    console.log("Uploading to path:", fileName);
    console.log("Bucket:", 'reports');
    
    // First verify bucket is accessible by listing files
    const { data: bucketFiles, error: listError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error("Cannot access reports bucket:", listError);
      if (isAdmin) {
        toast({
          title: "Storage Error",
          description: "Cannot access reports bucket. Report downloaded locally only.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    console.log("Successfully verified bucket access before upload");
    
    // Upload with multiple retries
    let uploadSuccess = false;
    let uploadError = null;
    let data = null;
    
    // Try different upload configurations
    const uploadConfigs = [
      // Standard upload with content type
      {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      },
      // Simple upload with just upsert
      { 
        upsert: true 
      },
      // Basic upload with no options
      {}
    ];
    
    for (const config of uploadConfigs) {
      if (uploadSuccess) break;
      
      try {
        console.log("Attempting upload with config:", config);
        
        const result = await supabase.storage
          .from('reports')
          .upload(fileName, pdfBlob, config);
        
        if (result.error) {
          console.error("Upload attempt failed:", result.error);
          uploadError = result.error;
        } else {
          console.log("Upload successful with config:", config);
          data = result.data;
          uploadSuccess = true;
          break;
        }
      } catch (e) {
        console.error("Exception during upload attempt:", e);
        uploadError = e;
      }
    }
    
    if (!uploadSuccess) {
      console.error("All upload attempts failed. Last error:", uploadError);
      if (isAdmin) {
        toast({
          title: "Upload Failed",
          description: "Report downloaded locally but cloud save failed after multiple attempts.",
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
    
    // Verify the file exists by listing it
    const { data: verifyData, error: verifyError } = await supabase.storage
      .from('reports')
      .list('', { 
        search: fileName 
      });
    
    if (verifyError || !verifyData || !verifyData.find(f => f.name === fileName)) {
      console.error("File verification failed - upload appeared successful but file not found in listing");
      if (isAdmin) {
        toast({
          title: "Storage Warning",
          description: "Upload appeared successful but file verification failed. Report downloaded locally.",
          variant: "default"
        });
      }
    } else {
      console.log("✅ File verified in storage listing");
      if (isAdmin) {
        toast({
          title: "Report Saved",
          description: "Your report was successfully saved to the cloud.",
          variant: "default"
        });
      }
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in savePDFToStorage:", error);
    return null;
  }
}
