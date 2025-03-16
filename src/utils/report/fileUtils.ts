
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
    
    // Make sure reports bucket exists before uploading
    const bucketExists = await verifyReportsBucket();
    console.log("Bucket exists or was created:", bucketExists);
    
    if (!bucketExists) {
      console.error("Reports bucket does not exist and could not be created");
      if (isAdmin) {
        toast({
          title: "Storage Error",
          description: "Could not access or create the reports storage. Your report was downloaded locally.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    // Use a simpler filename to prevent path issues, with timestamp to avoid conflicts
    const timestamp = new Date().getTime();
    const filePath = `${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}_${timestamp}.pdf`;
    
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
      console.error("Error status:", error.statusCode);
      
      // Check for specific error types
      if (error.message.includes("storage/object-not-found")) {
        console.error("The reports bucket might exist but the path is invalid");
      } else if (error.message.includes("Permission denied")) {
        console.error("User lacks permission to upload to the reports bucket");
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
