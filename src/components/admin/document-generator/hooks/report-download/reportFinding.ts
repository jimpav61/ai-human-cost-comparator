
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getSafeFileName } from "@/utils/report/validation";

// Find existing reports for a lead and download them
export const findOrGenerateReport = async (lead: Lead, setIsLoading: (isLoading: boolean) => void) => {
  try {
    console.log('---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------');
    console.log('Lead ID for report download:', lead.id);
    console.log('Lead company name:', lead.company_name);
    console.log('Lead email:', lead.email);
    
    // Check if lead ID exists
    if (!lead.id) {
      throw new Error("Lead ID is missing");
    }
    
    // First, try to find the report in the database using multiple search methods
    console.log("Searching for reports with the following criteria:");
    console.log("- Lead ID:", lead.id);
    console.log("- Company name:", lead.company_name);
    console.log("- Email:", lead.email);
    
    // 1. Try direct lead_id match first
    let { data: reportResults, error: searchError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('lead_id', lead.id)
      .order('report_date', { ascending: false })
      .limit(1);
    
    // 2. If no reports found by lead_id, try to find by report ID matching lead ID (legacy case)
    if (!reportResults || reportResults.length === 0) {
      console.log('No reports found by lead_id, trying exact report ID match...');
      const { data: exactMatch, error: exactMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
        
      if (exactMatch && !exactMatchError) {
        console.log('Found report by direct ID match');
        reportResults = [exactMatch];
      } else if (lead.email) {
        // 3. Try matching by email as a fallback
        console.log('No direct ID match, trying email match...');
        const { data: emailMatches, error: emailMatchError } = await supabase
          .from('generated_reports')
          .select('*')
          .eq('email', lead.email)
          .order('report_date', { ascending: false })
          .limit(1);
          
        if (emailMatches && emailMatches.length > 0 && !emailMatchError) {
          console.log('Found report by email match');
          reportResults = emailMatches;
        }
      }
    }
    
    if (searchError) {
      console.error('Error searching for reports:', searchError);
      throw new Error('Failed to search for reports');
    }
    
    if (!reportResults || reportResults.length === 0) {
      console.log('No reports found for lead:', lead.id);
      toast({
        title: "No Report Available",
        description: "No report has been generated for this lead yet.",
        variant: "warning",
      });
      setIsLoading(false);
      return;
    }
    
    const report = reportResults[0];
    console.log('Found report for lead:', report.id);
    
    // Now check the storage bucket for the PDF file
    // First verify bucket exists
    await verifyReportsBucket();
    
    // Look for stored PDF in Supabase storage
    const pdfFileName = `${report.id}.pdf`;
    console.log('Checking for PDF file:', pdfFileName);
    
    try {
      // First check if the file exists
      const { data: filesList, error: filesError } = await supabase.storage
        .from('reports')
        .list('', {
          search: pdfFileName
        });
        
      if (filesError) {
        console.error('Error listing files in storage:', filesError);
        throw new Error('Failed to check if report file exists');
      }
      
      console.log('Files matching search:', filesList);
      
      const fileExists = filesList && filesList.some(f => f.name === pdfFileName);
      
      if (!fileExists) {
        console.log('File not found in storage, searching for alternative files');
        
        // List all files in the bucket to see what's available
        const { data: allFiles } = await supabase.storage
          .from('reports')
          .list('');
          
        console.log('All files in reports bucket:', allFiles);
        
        toast({
          title: "Report File Not Found",
          description: "The report file could not be found in storage.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Get the public URL directly
      const { data: urlData } = await supabase.storage
        .from('reports')
        .getPublicUrl(pdfFileName);
      
      if (!urlData || !urlData.publicUrl) {
        console.log('No public URL found for PDF');
        throw new Error('Report file not found in storage');
      }
      
      console.log('Found stored PDF, downloading from:', urlData.publicUrl);
      
      // Verify the URL is accessible
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        
        if (!response.ok) {
          console.error(`PDF URL check failed with status ${response.status}`);
          throw new Error(`Report file not accessible (status ${response.status})`);
        }
      } catch (checkError) {
        console.error("Error verifying PDF URL:", checkError);
        throw new Error("Report file could not be accessed");
      }
      
      // Trigger direct download of the PDF using the URL
      const link = document.createElement('a');
      link.href = urlData.publicUrl;
      const safeCompanyName = getSafeFileName(lead);
      link.download = `${safeCompanyName}-ChatSites-ROI-Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Report Downloaded",
        description: "The report has been successfully downloaded.",
        duration: 1000,
      });
      
    } catch (storageError) {
      console.error('Error accessing stored PDF:', storageError);
      toast({
        title: "Report Error",
        description: storageError instanceof Error ? storageError.message : "Unable to download report file.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
    
  } catch (error) {
    console.error("Error in findOrGenerateReport:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "An unexpected error occurred.",
      variant: "destructive",
    });
    setIsLoading(false);
  }
};

// Helper function to verify the reports storage bucket exists
const verifyReportsBucket = async () => {
  try {
    console.log("Verifying 'reports' bucket is accessible...");
    
    // Check if the bucket exists by trying to list files in it
    const { data, error } = await supabase.storage.from('reports').list();
    
    if (error) {
      console.error("Error accessing 'reports' bucket:", error);
      return false;
    }
    
    console.log("Successfully verified 'reports' bucket exists. Files count:", data?.length);
    return true;
  } catch (error) {
    console.error("Error verifying reports bucket:", error);
    return false;
  }
};
