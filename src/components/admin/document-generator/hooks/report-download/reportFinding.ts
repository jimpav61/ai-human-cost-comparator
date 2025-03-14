
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
    
    // Check if lead ID exists
    if (!lead.id) {
      throw new Error("Lead ID is missing");
    }
    
    // First, try to find the report in the database by lead_id
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
    
    // Direct download from storage using the report ID
    const pdfFileName = `${report.id}.pdf`;
    console.log('Looking for PDF file:', pdfFileName);
    
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(pdfFileName);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('No public URL found for PDF');
      toast({
        title: "Report Error",
        description: "Report file not found in storage.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    console.log('Found stored PDF, downloading from:', urlData.publicUrl);
    
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
    
  } catch (error) {
    console.error("Error in findOrGenerateReport:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "An unexpected error occurred.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
    console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ENDED ----------");
  }
};
