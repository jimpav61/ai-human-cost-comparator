
import { Lead } from "@/types/leads";
import { generateReportPDF } from "./pdf/generator";
import { savePDFToStorage } from "./fileUtils";
import { toast } from "@/hooks/use-toast";

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
      duration: 1000,
    });
    
    // Detect iOS and adjust delay accordingly
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                  !(navigator.platform && /Win|Mac|Linux/.test(navigator.platform));
    const workshopDelay = isIOS ? 3000 : 1500; // Longer delay for iOS to allow PDF interaction
    
    // Attempt to save to storage in parallel
    try {
      // Create a standardized UUID filename for storage
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
    
    // Redirect to workshop page after delay
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
      
      console.log("Redirecting to workshop page with lead ID:", lead.id);
      
      // Simple direct navigation to workshop page
      const workshopUrl = `/workshop?leadId=${lead.id}`;
      window.location.href = workshopUrl;
      
    }, workshopDelay); // Dynamic delay based on device
    
    return true;
  } catch (error) {
    console.error("Error generating report:", error);
    toast({
      title: "Error",
      description: "Failed to generate report. Please try again.",
      variant: "destructive",
      duration: 1000,
    });
    return false;
  }
}
