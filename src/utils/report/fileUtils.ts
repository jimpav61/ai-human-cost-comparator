
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
export async function savePDFToStorage(pdfDoc: jsPDF, fileName: string): Promise<string | null> {
  try {
    console.log("Starting PDF storage process for", fileName);
    
    // Make sure reports bucket exists
    const bucketExists = await verifyReportsBucket();
    if (!bucketExists) {
      console.error("Failed to verify or create reports bucket");
      toast({
        title: "Storage Error",
        description: "Unable to access storage. Your report was downloaded locally but not saved to the cloud.",
        variant: "destructive"
      });
      return null;
    }
    
    console.log("✅ Reports bucket verified successfully");
    
    // First convert the PDF to a blob
    const pdfBlob = await convertPDFToBlob(pdfDoc);
    console.log("PDF converted to blob, size:", pdfBlob.size);
    
    // Upload the file to Supabase storage with a timestamp prefix to avoid conflicts
    const filePath = `${Date.now()}_${fileName}`;
    
    // Debug logging to verify the upload parameters
    console.log("Uploading to path:", filePath);
    console.log("Bucket:", 'reports');
    
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
      });
    
    if (error) {
      console.error("Error uploading PDF to storage:", error);
      toast({
        title: "Upload Failed",
        description: "Your report was downloaded locally but could not be saved to the cloud.",
        variant: "destructive"
      });
      throw error;
    }
    
    console.log("✅ PDF successfully uploaded:", data);
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(filePath);
    
    console.log("Generated public URL:", urlData);
    
    // Double check that the file was actually saved by listing the bucket contents
    const { data: fileList, error: listError } = await supabase.storage
      .from('reports')
      .list();
      
    if (listError) {
      console.error("Error listing bucket contents:", listError);
    } else {
      console.log("Current files in bucket:", fileList);
      const savedFile = fileList.find(f => f.name === filePath);
      if (savedFile) {
        console.log("✅ Confirmed file was saved to bucket:", savedFile);
        toast({
          title: "Report Saved",
          description: "Your report was successfully saved to the cloud.",
          variant: "default"
        });
      } else {
        console.warn("File doesn't appear in bucket listing yet. This could be due to eventual consistency.");
      }
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in savePDFToStorage:", error);
    return null;
  }
}
