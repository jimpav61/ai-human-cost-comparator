
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateAndUploadPDF } from "./pdfGeneration";
import { getSafeFileName } from "@/utils/report/validation";
import { verifyReportsBucket } from "@/utils/report/bucketUtils";

// Find and download a report for a given lead
export async function findAndDownloadReport(lead: Lead, setIsLoading: (loading: boolean) => void) {
  console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------");
  console.log("Lead ID for report download:", lead.id);
  console.log("Lead company name:", lead.company_name);

  try {
    // Validate the lead ID - essential for exact matching
    if (!lead.id) {
      console.error("Missing lead ID, cannot search for reports");
      throw new Error("Missing lead ID");
    }

    // First, make sure the reports bucket exists
    const bucketExists = await verifyReportsBucket();
    if (!bucketExists) {
      console.error("Reports bucket doesn't exist or can't be accessed");
      toast({
        title: "Storage Error",
        description: "The reports storage is not properly configured. Please contact support.",
        variant: "destructive",
        duration: 5000,
      });
      setIsLoading(false);
      return;
    }

    // Get exact lead ID for consistent searching
    const exactLeadId = lead.id.trim();
    console.log("Using exact lead ID for matching:", exactLeadId);
    
    // FIRST: Check the database for reports with this lead ID to get the report UUID
    console.log("Checking database for reports with lead ID:", exactLeadId);
    
    const { data: reports, error } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('lead_id', exactLeadId)
      .order('report_date', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error checking database for reports:", error);
    } else if (reports && reports.length > 0) {
      console.log("Found report in database with ID:", reports[0].id);
      
      // Use the report UUID to find the PDF in storage
      const reportUuid = reports[0].id;
      const reportFilePath = `${reportUuid}.pdf`;
      
      console.log("Looking for PDF file with name:", reportFilePath);
      
      // Get the file directly using the report UUID
      const { data: urlData, error: urlError } = await supabase.storage
        .from('reports')
        .getPublicUrl(reportFilePath);
        
      if (urlData?.publicUrl) {
        console.log("Found PDF using report UUID. Downloading from URL:", urlData.publicUrl);
        
        // Verify the URL is accessible before creating the download link
        try {
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          if (!response.ok) {
            console.log(`Report exists in database but file not found in storage. Status: ${response.status}`);
            console.log("Generating a new PDF...");
            await generateAndUploadPDF(reports[0], lead);
            setIsLoading(false);
            return;
          }
          
          // Create download link
          const link = document.createElement('a');
          link.href = urlData.publicUrl;
          link.download = `${getSafeFileName(lead)}-ChatSites-ROI-Report.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Report Downloaded",
            description: "The report has been successfully downloaded.",
            duration: 3000,
          });
          setIsLoading(false);
          return;
        } catch (fetchError) {
          console.error("Error verifying PDF URL accessibility:", fetchError);
          console.log("Attempting to regenerate the PDF...");
          await generateAndUploadPDF(reports[0], lead);
          setIsLoading(false);
          return;
        }
      } else if (urlError) {
        console.error("Error getting public URL:", urlError);
        console.log("No file found with report UUID. Trying to generate a new PDF.");
        await generateAndUploadPDF(reports[0], lead);
        setIsLoading(false);
        return;
      } else {
        console.log("No file found with report UUID. Trying to generate a new PDF.");
        await generateAndUploadPDF(reports[0], lead);
        setIsLoading(false);
        return;
      }
    } else {
      console.log("No reports found in database for lead ID:", exactLeadId);
    }
    
    // SECOND: Fall back to checking for any files in storage that might match the lead
    console.log("Checking storage for any files related to this lead...");
    
    const { data: storageFiles, error: storageError } = await supabase
      .storage
      .from('reports')
      .list();
      
    if (storageError) {
      console.error("Error listing storage files:", storageError);
      throw new Error("Unable to access reports storage");
    }
    
    if (storageFiles && storageFiles.length > 0) {
      console.log("All files in reports bucket:", storageFiles.map(f => f.name));
      
      // Try multiple approaches to find a matching file
      
      // 1. Try files with exact lead ID in name
      let matchingFile = storageFiles.find(file => 
        file.name.includes(exactLeadId)
      );
      
      // 2. If no match, try with company name as fallback
      if (!matchingFile && lead.company_name) {
        const safeCompanyName = getSafeFileName(lead);
        console.log("Trying to match by company name:", safeCompanyName);
        
        matchingFile = storageFiles.find(file => 
          file.name.toLowerCase().includes(safeCompanyName.toLowerCase())
        );
      }
      
      if (matchingFile) {
        console.log("Found potential matching file:", matchingFile.name);
        
        // Get the public URL
        const { data: urlData } = await supabase.storage
          .from('reports')
          .getPublicUrl(matchingFile.name);
          
        if (urlData?.publicUrl) {
          console.log("Downloading report from URL:", urlData.publicUrl);
          
          // Create download link
          const link = document.createElement('a');
          link.href = urlData.publicUrl;
          link.download = `${getSafeFileName(lead)}-ChatSites-ROI-Report.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Report Downloaded",
            description: "The report has been successfully downloaded.",
            duration: 3000,
          });
          setIsLoading(false);
          return;
        }
      } else {
        console.log("No matching files found in storage for this lead");
      }
    }
    
    // If we got here, no report was found
    console.log("No existing report found for lead:", exactLeadId);
    setIsLoading(false);
    
    toast({
      title: "No Report Found",
      description: "No report exists for this lead. Please generate a report first.",
      variant: "destructive",
      duration: 3000,
    });
    
  } catch (error) {
    console.error("Error in findAndDownloadReport:", error);
    setIsLoading(false);
    
    toast({
      title: "Error",
      description: "Failed to find or download report. Please try again.",
      variant: "destructive",
      duration: 3000,
    });
  }
  
  console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ENDED ----------");
}
