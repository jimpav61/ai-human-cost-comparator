
import { Lead } from "@/types/leads";
import { generateReportPDF } from "./pdf/generator";
import { savePDFToStorage } from "./fileUtils";
import { toast } from "@/hooks/use-toast";

export async function generateAndDownloadReport(lead: Lead): Promise<boolean> {
  try {
    console.log("Front-end: Generating report for lead:", lead.id);
    
    // First, set a flag in sessionStorage that we're downloading a report and should redirect to workshop
    // This will be checked when the page reloads (such as after iOS Safari PDF viewing and hitting back)
    sessionStorage.setItem('pendingWorkshop', lead.id);
    
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
    
    // Detect iOS using a more reliable approach - simply check for iOS devices in userAgent
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    console.log("Device detection - isIOS:", isIOS);
    
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
    
    // Navigate to the workshop page immediately after download starts
    // This ensures the user lands on the workshop page when they return from viewing the PDF
    console.log("Navigating to workshop page with lead ID:", lead.id);
    const workshopUrl = `/workshop?leadId=${lead.id}`;
    window.location.href = workshopUrl;
    
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
