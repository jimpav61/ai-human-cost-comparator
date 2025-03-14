
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateAndUploadPDF } from "./pdfGeneration";
import { getSafeFileName } from "@/utils/report/validation";

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

    // Get exact lead ID for consistent searching
    const exactLeadId = lead.id.trim();
    console.log("Using exact lead ID for matching:", exactLeadId);
    
    // FIRST PRIORITY: Check 'reports' storage bucket for EXACT lead ID match
    console.log("Checking 'reports' storage bucket for files with EXACT lead ID:", exactLeadId);
    
    const { data: storageFiles, error: storageError } = await supabase
      .storage
      .from('reports')
      .list();
      
    if (storageError) {
      console.error("Error listing storage files in 'reports' bucket:", storageError);
      throw new Error("Unable to access reports storage");
    }
    
    if (storageFiles && storageFiles.length > 0) {
      console.log("All files in reports bucket:", storageFiles.map(f => f.name));
      
      // STRICT MATCHING: Only look for the exact lead ID in filenames
      const exactMatches = storageFiles.filter(file => 
        file.name.includes(exactLeadId)
      );
      
      if (exactMatches.length > 0) {
        console.log("Found exact lead ID matches:", exactMatches.map(f => f.name));
        
        // Use the first match (most recent if sorted by filename)
        const matchingFile = exactMatches[0];
        
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
        } else {
          console.error("Failed to get public URL for matching file:", matchingFile.name);
        }
      } else {
        console.log("No exact lead ID matches found in storage files");
      }
    } else {
      console.log("No files found in 'reports' bucket or bucket is empty");
    }
    
    // Check database as fallback - using exact lead ID
    console.log("No matching files in storage, checking database for lead ID:", exactLeadId);
    
    const { data: reports, error } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('lead_id', exactLeadId)
      .order('report_date', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error checking database for reports:", error);
    } else if (reports && reports.length > 0) {
      console.log("Found report in database:", reports[0].id);
      await generateAndUploadPDF(reports[0], lead);
      setIsLoading(false);
      return;
    } else {
      console.log("No reports found in database for lead ID:", exactLeadId);
    }
    
    // If we got here, no report was found
    console.log("No existing report found with lead ID:", exactLeadId);
    setIsLoading(false);
    
    toast({
      title: "No Report Found",
      description: "No existing report found for this lead. Please generate a report first.",
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
