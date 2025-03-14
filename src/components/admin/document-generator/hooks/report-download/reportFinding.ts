
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

    // First, make sure the reports bucket exists and is accessible
    const bucketAccessible = await verifyReportsBucket();
    if (!bucketAccessible) {
      console.error("Reports bucket is not accessible, cannot download reports");
      throw new Error("Reports storage is not accessible");
    }
    
    console.log("Bucket verification successful, proceeding with report search");
    
    // Get exact lead ID for consistent searching
    const exactLeadId = lead.id.trim();
    
    // STEP 1: Check the database first for reports with this lead ID
    console.log("Checking database for reports with lead ID:", exactLeadId);
    
    const { data: reports, error } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('lead_id', exactLeadId)
      .order('report_date', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("Error querying database for reports:", error);
    } else if (reports && reports.length > 0) {
      console.log("Found report in database:", reports[0]);
      
      // We found a report in the database, now try to get the file from storage
      const reportId = reports[0].id;
      const fileName = `${reportId}.pdf`;
      
      console.log("Looking for file in storage with name:", fileName);
      
      // Try to get the public URL for this file
      const { data: urlData } = await supabase.storage
        .from('reports')
        .getPublicUrl(fileName);
      
      if (urlData?.publicUrl) {
        console.log("Found PDF in storage with URL:", urlData.publicUrl);
        
        // Verify the file exists by making a HEAD request
        try {
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          
          if (response.ok) {
            console.log("File exists and is accessible, downloading it");
            
            // Create download link
            const link = document.createElement('a');
            link.href = urlData.publicUrl;
            link.download = `${getSafeFileName(lead)}-ChatSites-ROI-Report.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
              title: "Report Downloaded",
              description: "The existing report has been successfully downloaded.",
              duration: 3000,
            });
            
            setIsLoading(false);
            return;
          } else {
            console.error(`File returned status ${response.status}. Need to regenerate.`);
          }
        } catch (fetchError) {
          console.error("Error verifying file accessibility:", fetchError);
        }
      }
      
      // If we get here, the report exists in the database but we couldn't download the file
      console.log("Report exists in database but couldn't download the file. Will regenerate.");
      await generateAndUploadPDF(reports[0], lead);
      setIsLoading(false);
      return;
    }
    
    // STEP 2: If no report in database, check storage directly to see if there are any files
    console.log("No reports found in database. Checking storage for files...");
    
    const { data: files, error: listError } = await supabase.storage
      .from('reports')
      .list();
    
    if (listError) {
      console.error("Error listing files in storage:", listError);
    } else if (files && files.length > 0) {
      console.log(`Found ${files.length} files in storage. Searching for match with lead ID:`, exactLeadId);
      
      // Look for files that contain the lead ID in the filename
      const matchingFiles = files.filter(file => file.name.includes(exactLeadId));
      
      if (matchingFiles.length > 0) {
        console.log("Found matching files:", matchingFiles.map(f => f.name));
        
        // Use the first matching file
        const file = matchingFiles[0];
        
        // Get the public URL
        const { data: urlData } = await supabase.storage
          .from('reports')
          .getPublicUrl(file.name);
        
        if (urlData?.publicUrl) {
          console.log("Downloading file from URL:", urlData.publicUrl);
          
          // Create download link
          const link = document.createElement('a');
          link.href = urlData.publicUrl;
          link.download = `${getSafeFileName(lead)}-ChatSites-ROI-Report.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Report Downloaded",
            description: "An existing report has been found and downloaded.",
            duration: 3000,
          });
          
          setIsLoading(false);
          return;
        }
      } else {
        console.log("No files found that match the lead ID");
      }
    } else {
      console.log("No files found in storage");
    }
    
    // If we get here, we need to generate a new report
    console.log("No existing reports found. Generating a new report.");
    
    const newReport = {
      id: crypto.randomUUID(),
      lead_id: lead.id,
      report_date: new Date().toISOString(),
      calculator_inputs: lead.calculator_inputs || {},
      calculator_results: lead.calculator_results || {}
    };
    
    await generateAndUploadPDF(newReport, lead);
    setIsLoading(false);
    
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
