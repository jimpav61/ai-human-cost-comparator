
import { Lead } from "@/types/leads";
import { toast } from "@/components/ui/use-toast";
import { generateReportPDF } from "../pdf/generator";
import { convertPDFToBlob } from "../pdf/conversion";
import { getSafeFileName } from "../validation";
import { supabase } from "@/integrations/supabase/client";
import { verifyReportsBucket } from "../storageUtils";
import { jsPDF } from "jspdf";
import { toJson } from "@/hooks/calculator/supabase-types";

/**
 * Generate and immediately download a report without saving to database
 * Used in the customer-facing calculator
 */
export function generateAndDownloadReport(lead: Lead): boolean {
  try {
    console.log("Generating and downloading report for lead:", lead.id);
    
    if (!lead || !lead.company_name || !lead.calculator_results) {
      console.error("Missing required data for report generation");
      toast({
        title: "Missing Data",
        description: "Cannot generate report: company name or calculator results missing",
        variant: "destructive"
      });
      return false;
    }
    
    // No need to validate ID - all leads already have valid UUIDs
    console.log("Using lead with ID:", lead.id);
    
    // Generate PDF
    const pdfDoc = generateReportPDF(lead);
    
    // Create safe filename
    const safeFileName = getSafeFileName(lead);
    
    // Save/download the document for the user
    pdfDoc.save(`${safeFileName}-ChatSites-ROI-Report.pdf`);
    
    toast({
      title: "Success",
      description: "ROI Report downloaded successfully",
      variant: "default"
    });
    
    // Try to save to database and storage in the background
    saveReportInBackground(lead, pdfDoc);
    
    return true;
  } catch (error) {
    console.error("Error generating report:", error);
    toast({
      title: "Error",
      description: "Failed to generate report. Please try again.",
      variant: "destructive"
    });
    return false;
  }
}

/**
 * Helper function to save the report to storage in the background
 */
async function saveReportInBackground(lead: Lead, pdfDoc: jsPDF): Promise<void> {
  console.log("Attempting to save report to storage in the background...");
  
  // Check if user is authenticated before attempting to save
  const { data: { session }} = await supabase.auth.getSession();
  
  if (!session) {
    console.log("User is not authenticated - skipping report storage");
    return;
  }
  
  const bucketAccessible = await verifyReportsBucket();
  if (!bucketAccessible) {
    console.error("Cannot save report to storage - bucket not accessible");
    return;
  }
  
  try {
    // Convert PDF to blob
    const pdfBlob = await convertPDFToBlob(pdfDoc);
    
    // Generate a unique filename
    const safeFileName = getSafeFileName(lead);
    const fileName = `${Date.now()}_${safeFileName}.pdf`;
    
    // Upload to storage
    const { data: fileData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.error("Error uploading PDF to storage:", uploadError);
      return;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);
    
    if (!urlData || !urlData.publicUrl) {
      console.error("Failed to get public URL for uploaded file");
      return;
    }
    
    // Save report data in database
    const reportId = crypto.randomUUID();
    
    // Insert data to generated_reports table
    const { error: insertError } = await supabase
      .from('generated_reports')
      .insert({
        id: reportId,
        lead_id: lead.id,
        contact_name: lead.name,
        company_name: lead.company_name,
        email: lead.email,
        phone_number: lead.phone_number || null,
        calculator_inputs: toJson(lead.calculator_inputs),
        calculator_results: toJson(lead.calculator_results),
        report_date: new Date().toISOString()
      });
    
    if (insertError) {
      console.error("Error inserting report data:", insertError);
      return;
    }
    
    console.log("Front-end report saved to database and storage successfully with ID:", reportId);
  } catch (error) {
    console.error("Error in saveReportInBackground:", error);
  }
}
