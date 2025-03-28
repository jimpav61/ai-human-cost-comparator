
import { Lead } from "@/types/leads";
import { generateReportPDF } from "./pdf/generator";
import { savePDFToStorage } from "./fileUtils";
import { toast } from "@/hooks/use-toast";

/**
 * Generate and download a report from the front-end calculator
 * This function generates a PDF and downloads it to the user's device
 * It also attempts to save the report to Supabase storage if the user is authenticated
 */
export async function generateAndDownloadReport(lead: Lead): Promise<boolean> {
  try {
    console.log("Front-end: Generating report for lead:", lead.id);
    
    // Generate the PDF document
    const pdfDoc = generateReportPDF(lead);
    
    // Save the document to the user's device with proper file name
    const fileName = `${lead.company_name.replace(/[^a-zA-Z0-9]/g, '-')}-ChatSites-ROI-Report.pdf`;
    pdfDoc.save(fileName);
    
    // Show success toast for the download
    toast({
      title: "Success",
      description: "ROI Report downloaded successfully",
      variant: "default",
      duration: 1500,
    });
    
    // Attempt to save to storage in parallel - using the reliable method that works in admin
    try {
      // Create a standardized UUID filename for storage (the key part that works in admin)
      const storageFileName = `${lead.id}.pdf`;
      console.log("Front-end: Attempting to save report to storage with filename:", storageFileName);
      
      // Use the same savePDFToStorage function that works in the admin panel
      const publicUrl = await savePDFToStorage(pdfDoc, storageFileName, false);
      
      if (publicUrl) {
        console.log("Front-end: Report successfully saved to storage:", publicUrl);
      } else {
        console.log("Front-end: Report downloaded but not saved to storage - user likely not authenticated");
      }
    } catch (storageError) {
      // Don't show error to user - just log it, since download was successful
      console.error("Error saving report to storage:", storageError);
    }
    
    // Redirect to workshop page after a short delay
    setTimeout(() => {
      // Extract tier and AI type information for the workshop
      const tierName = lead.calculator_results?.tierKey || lead.calculator_inputs?.aiTier || 'Standard';
      const aiType = lead.calculator_results?.aiType || lead.calculator_inputs?.aiType || 'Chat Only';
      
      // Create lead data object for the workshop
      const leadData = {
        id: lead.id,
        name: lead.name,
        companyName: lead.company_name,
        email: lead.email,
        phoneNumber: lead.phone_number,
        website: lead.website,
        industry: lead.industry,
        employeeCount: lead.employee_count,
        calculator_results: lead.calculator_results || {}
      };
      
      // Use React Router's navigate function via state object to prevent full page reload
      // Use window.location.href with proper state data encoded
      window.location.href = `/workshop?leadId=${lead.id}`;
    }, 800); // Slightly longer delay to ensure download completes
    
    return true;
  } catch (error) {
    console.error("Error generating report:", error);
    toast({
      title: "Error",
      description: "Failed to generate report. Please try again.",
      variant: "destructive",
      duration: 1500,
    });
    return false;
  }
}
