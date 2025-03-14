
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { convertPDFToBlob } from "./pdf/conversion";
import { jsPDF } from "jspdf";

// Make sure the reports bucket exists
export async function verifyReportsBucket() {
  // Check if the 'reports' bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  
  if (!buckets?.find(bucket => bucket.name === 'reports')) {
    // Create the bucket if it doesn't exist
    const { error } = await supabase.storage.createBucket('reports', {
      public: false, // Keep reports private
    });
    
    if (error) {
      console.error("Error creating reports bucket:", error);
      return false;
    }
    
    console.log("Created 'reports' bucket");
  }
  
  return true;
}

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
    await verifyReportsBucket();
    
    // First convert the PDF to a blob
    const pdfBlob = await convertPDFToBlob(pdfDoc);
    console.log("PDF converted to blob, size:", pdfBlob.size);
    
    // Upload the file to Supabase storage
    const filePath = `${Date.now()}_${fileName}`;
    
    // Debug logging to verify the upload parameters
    console.log("Uploading to path:", filePath);
    console.log("Bucket:", 'reports');
    
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });
    
    if (error) {
      console.error("Error uploading PDF to storage:", error);
      throw error;
    }
    
    console.log("PDF successfully uploaded:", data);
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in savePDFToStorage:", error);
    return null;
  }
}
