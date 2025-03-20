
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { convertPDFToBlob } from "./pdf/conversion";
import { jsPDF } from "jspdf";
import { uploadPDFToBucket } from "./storage/directUpload";

/**
 * Save a PDF file to Supabase storage
 * @param pdfDoc The PDF document to save
 * @param fileName The name to save the file as (always use UUID.pdf format)
 * @returns URL to the saved file or null if there was an error
 */
export async function savePDFToStorage(
  pdfDoc: jsPDF, 
  fileName: string, 
  isAdmin: boolean = false
): Promise<string | null> {
  try {
    console.log("Starting PDF storage process for file:", fileName);
    
    // Simplified authentication check - no refresh attempt (which was failing)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error("Authentication error:", sessionError?.message || "No active session");
      if (isAdmin) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to save reports to the cloud.",
          variant: "default"
        });
      }
      return null;
    }
    
    console.log("Using session for user:", sessionData.session.user.id);
    
    // Convert the PDF to a blob
    const pdfBlob = await convertPDFToBlob(pdfDoc);
    console.log("PDF converted to blob, size:", pdfBlob.size);
    
    // Validate UUID format for consistency
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;
    if (!fileName.match(uuidPattern)) {
      console.warn("Non-UUID filename provided:", fileName);
      // Don't throw error, just log the warning
    }
    
    // Use the direct upload utility for simplified upload
    const publicUrl = await uploadPDFToBucket(fileName, pdfBlob, !isAdmin);
    
    if (!publicUrl) {
      console.error("Failed to upload PDF to storage");
      if (isAdmin) {
        toast({
          title: "Storage Warning",
          description: "Report downloaded locally but cloud save failed.",
          variant: "default"
        });
      }
      return null;
    }
    
    // Success!
    console.log("✅ PDF successfully uploaded, URL:", publicUrl);
    
    if (isAdmin) {
      toast({
        title: "Report Saved",
        description: "Your report was successfully saved to the cloud.",
        variant: "default"
      });
    }
    
    return publicUrl;
  } catch (error) {
    console.error("Error in savePDFToStorage:", error);
    return null;
  }
}
