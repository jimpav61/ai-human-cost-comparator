
import { Lead } from "@/types/leads";
import { generateReportPDF } from "./pdf/generator";
import { getSafeFileName } from "./validation";

export function generateAndDownloadReport(lead: Lead): boolean {
  try {
    console.log("Starting report generation for lead:", lead.id);
    
    // Generate the PDF document
    const doc = generateReportPDF(lead);
    
    // Get a safe filename based on company name
    const safeFileName = getSafeFileName(lead);
    
    // Trigger download
    doc.save(`${safeFileName}-ChatSites-ROI-Report.pdf`);
    
    console.log("Report generated and download triggered");
    return true;
  } catch (error) {
    console.error("Error generating report:", error);
    return false;
  }
}
