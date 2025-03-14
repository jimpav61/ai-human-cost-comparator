
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { verifyReportsBucket } from "./bucketUtils";
import { checkUserAuthentication } from "./databaseUtils";

/**
 * Save PDF to Supabase storage and return the URL
 */
export async function savePDFToStorage(reportId: string, pdfBlob: Blob): Promise<string | null> {
  try {
    console.log("Saving PDF to storage for report ID:", reportId);
    console.log("PDF Blob size:", pdfBlob.size, "bytes");
    
    // Verify the blob is not empty or invalid
    if (!pdfBlob || pdfBlob.size === 0) {
      console.error("Invalid PDF blob - empty or zero size");
      toast({
        title: "Report Error",
        description: "Could not generate a valid PDF file",
        variant: "destructive"
      });
      return null;
    }
    
    // Verify the bucket is accessible before attempting upload
    const bucketAccessible = await verifyReportsBucket();
    if (!bucketAccessible) {
      console.error("Cannot save PDF - reports bucket is not accessible. Please check your Supabase storage configuration.");
      toast({
        title: "Storage Error",
        description: "Unable to access storage. Please try again later.",
        variant: "destructive"
      });
      return null;
    }
    
    // Check authentication before uploading
    const { session } = await checkUserAuthentication();
    
    if (!session) {
      console.error("User is not authenticated - cannot upload PDF to storage");
      toast({
        title: "Authentication Required",
        description: "You must be logged in to upload files",
        variant: "destructive"
      });
      return null;
    }
    
    // The file path in storage
    const filePath = `${reportId}.pdf`;
    
    console.log("Uploading to bucket 'reports' with path:", filePath);
    
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
      
      // Add more detailed error diagnostics
      if (error.message.includes("row-level security policy")) {
        console.error("CRITICAL: RLS policy is preventing upload - check Supabase storage bucket permissions");
        console.error("Ensure the 'reports' bucket has RLS policies allowing uploads from authenticated users");
        toast({
          title: "Permission Error",
          description: "Storage permissions preventing upload. Please contact support.",
          variant: "destructive"
        });
      } else if (error.message.includes("bucket") && error.message.includes("not found")) {
        console.error("CRITICAL: Bucket 'reports' does not exist - it must be created in the Supabase dashboard");
        toast({
          title: "Configuration Error",
          description: "Storage bucket does not exist. Please contact support.",
          variant: "destructive"
        });
      } else if (error.message.includes("not authenticated")) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to upload files",
          variant: "destructive"
        });
      }
      
      return null;
    }
    
    console.log("Upload successful, data:", data?.path);
    
    // Get the public URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      console.error("Failed to get public URL for PDF");
      toast({
        title: "Storage Error",
        description: "Could not retrieve file URL after upload",
        variant: "destructive"
      });
      return null;
    }
    
    console.log("PDF saved to storage with URL:", urlData.publicUrl);
    
    // Verify the URL is accessible
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      console.log(`URL accessibility check result: status ${response.status}`);
      
      if (!response.ok) {
        console.error(`PDF URL check failed with status ${response.status}`);
        toast({
          title: "Warning",
          description: "Report was saved but may not be accessible. Please try downloading again.",
          variant: "destructive"
        });
      } else {
        console.log("PDF URL was successfully verified as accessible");
      }
    } catch (checkError) {
      console.error("Error verifying PDF URL:", checkError);
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Unexpected error saving PDF to storage:", error);
    toast({
      title: "Upload Error",
      description: "Unexpected error uploading file. Please try again.",
      variant: "destructive"
    });
    return null;
  }
}
