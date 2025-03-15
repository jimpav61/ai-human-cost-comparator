
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
    
    // First convert the PDF to a blob
    const pdfBlob = await convertPDFToBlob(pdfDoc);
    console.log("PDF converted to blob, size:", pdfBlob.size);
    
    // Make sure reports bucket exists
    const bucketExists = await verifyReportsBucket();
    if (!bucketExists) {
      console.error("Reports bucket doesn't exist or couldn't be created");
      
      if (isAdmin) {
        toast({
          title: "Storage Error",
          description: "Unable to access storage. Your report was downloaded locally but not saved to the cloud.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    console.log("✅ Reports bucket verified successfully");
    
    // Upload the file to Supabase storage with a simpler filename
    // Use a simpler filename to prevent path issues
    const filePath = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Debug logging to verify the upload parameters
    console.log("Uploading to path:", filePath);
    console.log("Bucket:", 'reports');
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
      });
    
    if (error) {
      console.error("Error uploading to storage:", error);
      if (isAdmin) {
        toast({
          title: "Upload Failed",
          description: "Your report was downloaded locally but could not be saved to the cloud.",
          variant: "destructive"
        });
      }
      return null;
    }
    
    console.log("✅ PDF successfully uploaded:", data);
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(filePath);
    
    console.log("Generated public URL:", urlData);
    
    // Verify file was saved by checking if URL is accessible
    try {
      const checkResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (checkResponse.ok) {
        console.log("✅ URL is accessible:", checkResponse.status);
        if (isAdmin) {
          toast({
            title: "Report Saved",
            description: "Your report was successfully saved to the cloud.",
            variant: "default"
          });
        }
      } else {
        console.warn("URL verification failed with status:", checkResponse.status);
      }
    } catch (err) {
      console.warn("Error checking URL accessibility:", err);
      // Continue anyway since this is just a verification step
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in savePDFToStorage:", error);
    return null;
  }
}
