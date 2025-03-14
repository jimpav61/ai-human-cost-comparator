
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
    // First attempt: Check 'reports' storage bucket directly for lead ID
    console.log("Checking 'reports' storage bucket for files with lead ID:", lead.id);
    
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
      
      // Look for any file that contains the lead ID
      const matchingFile = storageFiles.find(file => file.name.includes(lead.id));
      
      if (matchingFile) {
        console.log("Found matching file by lead ID:", matchingFile.name);
        
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
        // If no direct ID match, try company name matching as fallback
        console.log("No exact lead ID match, trying company name fallback...");
        const companyNameMatches = lead.company_name ? storageFiles.filter(file => 
          file.name.toLowerCase().includes(lead.company_name.toLowerCase().replace(/[^a-z0-9]/gi, ''))
        ) : [];
        
        if (companyNameMatches.length > 0) {
          console.log("Found potential company name matches:", companyNameMatches.map(f => f.name));
          
          // Use the most recent file (assuming filename sorting works)
          const mostRecentMatch = companyNameMatches[0];
          
          // Get the public URL
          const { data: urlData } = await supabase.storage
            .from('reports')
            .getPublicUrl(mostRecentMatch.name);
            
          if (urlData?.publicUrl) {
            console.log("Downloading report by company name match:", urlData.publicUrl);
            
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
        }
      }
    }
    
    // As a final fallback, check if there's a report in the database
    console.log("No matching files in storage, checking database...");
    
    const { data: reports, error } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('lead_id', lead.id)
      .order('report_date', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error checking database for reports:", error);
    } else if (reports && reports.length > 0) {
      console.log("Found report in database:", reports[0].id);
      await generateAndUploadPDF(reports[0], lead);
      setIsLoading(false);
      return;
    }
    
    // If we got here, no report was found
    console.log("No existing report found, notifying user to generate one first");
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
