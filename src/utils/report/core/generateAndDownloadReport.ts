
import { Lead } from "@/types/leads";
import { toast } from "@/components/ui/use-toast";
import { generateReportPDF } from "../pdfUtils";
import { ensureLeadHasValidId, getSafeFileName } from "../validation";
import { supabase } from "@/integrations/supabase/client";
import { verifyReportsBucket, saveReportToStorageWithRetry } from "../storageUtils";

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
    
    // Ensure lead has a valid UUID - replace temp-id with a real UUID
    const leadWithValidId = ensureLeadHasValidId(lead);
    console.log("Using lead with validated ID:", leadWithValidId.id);
    
    // Generate PDF
    const pdfDoc = generateReportPDF(leadWithValidId);
    
    // Create safe filename
    const safeFileName = getSafeFileName(leadWithValidId);
    
    // Save/download the document for the user
    pdfDoc.save(`${safeFileName}-ChatSites-ROI-Report.pdf`);
    
    toast({
      title: "Success",
      description: "ROI Report downloaded successfully",
      variant: "default"
    });
    
    // Try to save to database and storage in the background
    console.log("Attempting to save report to storage in the background...");
    
    // Check if user is authenticated before attempting to save
    supabase.auth.getSession().then(({ data: { session }}) => {
      if (!session) {
        console.log("User is not authenticated - skipping report storage");
        return;
      }
      
      verifyReportsBucket().then(bucketAccessible => {
        if (!bucketAccessible) {
          console.error("Cannot save report to storage - bucket not accessible");
          return;
        }
        
        // Attempt to save to storage
        saveReportToStorageWithRetry(leadWithValidId, pdfDoc)
          .then(result => {
            if (result.success) {
              console.log("Front-end report saved to database and storage successfully:", result);
            } else {
              console.error("Failed to save front-end report:", result.message);
            }
          })
          .catch(error => {
            console.error("Error in saveReportToStorageWithRetry:", error);
          });
      });
    });
    
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
