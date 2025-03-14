
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getSafeFileName } from "@/utils/report/validation";

// Find existing reports for a lead and download them
export const findAndDownloadReport = async (lead: Lead, setIsLoading: (isLoading: boolean) => void) => {
  try {
    console.log('---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------');
    console.log('Lead ID for report download:', lead.id);
    console.log('Lead company name:', lead.company_name);
    
    // Check if lead ID exists
    if (!lead.id) {
      throw new Error("Lead ID is missing");
    }
    
    // Find the report in the database by lead_id
    console.log("Searching for report with lead_id:", lead.id);
    
    const { data: reportResults, error: searchError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('lead_id', lead.id)
      .order('report_date', { ascending: false })
      .limit(1);
    
    if (searchError) {
      console.error('Error searching for reports:', searchError);
      throw new Error('Failed to search for reports');
    }
    
    if (!reportResults || reportResults.length === 0) {
      console.log('No reports found for lead:', lead.id);
      
      // Attempt a direct ID match (for older reports where lead_id might not be set)
      const { data: directIdMatch, error: directIdError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
        
      if (directIdError) {
        console.error('Error searching by direct ID:', directIdError);
      }
      
      if (directIdMatch) {
        console.log('Found report by direct ID match:', directIdMatch.id);
        // Download this report instead
        await downloadReportPDF(directIdMatch, lead, setIsLoading);
        return;
      }
      
      // If no report found by lead_id or direct ID, check storage directly for any report with this ID
      console.log('Checking storage directly for report with ID:', lead.id);
      
      const { data: fileExistsInStorage, error: storageError } = await supabase.storage
        .from('reports')
        .list('', {
          search: `${lead.id}.pdf`
        });
        
      if (storageError) {
        console.error('Error checking storage for files:', storageError);
      } else if (fileExistsInStorage && fileExistsInStorage.length > 0) {
        console.log('Found file directly in storage:', fileExistsInStorage[0].name);
        // File exists in storage but not in database, download it directly
        await downloadReportDirectlyFromStorage(lead.id, lead, setIsLoading);
        return;
      }
      
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
    
    await downloadReportPDF(report, lead, setIsLoading);
    
  } catch (error) {
    console.error("Error in findAndDownloadReport:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "An unexpected error occurred.",
      variant: "destructive",
    });
    setIsLoading(false);
  } finally {
    console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ENDED ----------");
  }
};

// Helper function to download a PDF directly from storage using lead ID
const downloadReportDirectlyFromStorage = async (reportId: string, lead: Lead, setIsLoading: (isLoading: boolean) => void) => {
  try {
    const pdfFileName = `${reportId}.pdf`;
    console.log('Getting PDF file directly from storage:', pdfFileName);
    
    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(pdfFileName);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('No public URL found for PDF');
      throw new Error('Report file not found in storage');
    }
    
    console.log('Found stored PDF, downloading from:', urlData.publicUrl);
    
    // Download the PDF
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
    
  } catch (error) {
    console.error("Error downloading PDF directly from storage:", error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

// Helper function to download the PDF from storage
const downloadReportPDF = async (report: any, lead: Lead, setIsLoading: (isLoading: boolean) => void) => {
  try {
    // Get the PDF file from storage using the report ID
    const pdfFileName = `${report.id}.pdf`;
    console.log('Getting PDF file:', pdfFileName);
    
    // Check if file exists in storage first
    const { data: fileList, error: fileListError } = await supabase.storage
      .from('reports')
      .list('', {
        search: pdfFileName,
        limit: 1
      });
      
    if (fileListError) {
      console.error('Error checking for file existence:', fileListError);
    }
    
    console.log('Storage file search results:', fileList);
    
    // Get the public URL - getPublicUrl doesn't return an error property in its response
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(pdfFileName);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('No public URL found for PDF');
      throw new Error('Report file not found in storage');
    }
    
    console.log('Found stored PDF, downloading from:', urlData.publicUrl);
    
    // Download the PDF
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
    
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
