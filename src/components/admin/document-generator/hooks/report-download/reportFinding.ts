
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
    // First attempt: Query generated_reports table for reports associated with this lead
    console.log("Searching for report with lead_id:", lead.id);
    const { data: reports, error } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('lead_id', lead.id)
      .order('report_date', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error searching for reports:", error);
      throw new Error("Failed to search for existing reports");
    }

    if (reports && reports.length > 0) {
      console.log("Found report in database:", reports[0].id);
      await generateAndUploadPDF(reports[0], lead);
      return;
    }

    console.log("No reports found with lead_id:", lead.id);
    
    // Second attempt: Check storage directly for any files with this lead ID pattern
    console.log("Checking storage directly for report with ID:", lead.id);
    
    try {
      // Check both 'reports' and 'generated_reports' buckets
      // First try 'reports' bucket which is the standard name
      const { data: storageFiles, error: storageError } = await supabase
        .storage
        .from('reports')
        .list();
        
      if (storageError) {
        console.error("Error listing storage files in 'reports' bucket:", storageError);
        
        // If that fails, try 'generated_reports' bucket as fallback
        const { data: altStorageFiles, error: altStorageError } = await supabase
          .storage
          .from('generated_reports')
          .list();
          
        if (altStorageError) {
          console.error("Error listing storage files in 'generated_reports' bucket:", altStorageError);
        } else if (altStorageFiles) {
          console.log("All files in generated_reports bucket:", altStorageFiles.map(f => f.name));
          
          // Look for any file that might be related to this lead (by ID or name)
          const matchingFile = altStorageFiles.find(file => 
            file.name.includes(lead.id) || 
            (lead.company_name && file.name.toLowerCase().includes(lead.company_name.toLowerCase()))
          );
          
          if (matchingFile) {
            console.log("Found potential matching file in 'generated_reports' storage:", matchingFile.name);
            
            // Get the public URL
            const { data: urlData } = await supabase.storage
              .from('generated_reports')
              .getPublicUrl(matchingFile.name);
              
            if (urlData?.publicUrl) {
              console.log("Found report in storage:", urlData.publicUrl);
              
              // Use the URL directly
              const link = document.createElement('a');
              link.href = urlData.publicUrl;
              link.download = `${getSafeFileName(lead)}-ChatSites-ROI-Report.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              toast({
                title: "Report Downloaded",
                description: "The report has been successfully downloaded from storage.",
                duration: 1000,
              });
              return;
            }
          }
        }
      } else if (storageFiles) {
        console.log("All files in reports bucket:", storageFiles.map(f => f.name));
        
        // Look for any file that might be related to this lead (by ID or name)
        const matchingFile = storageFiles.find(file => 
          file.name.includes(lead.id) || 
          (lead.company_name && file.name.toLowerCase().includes(lead.company_name.toLowerCase()))
        );
        
        if (matchingFile) {
          console.log("Found potential matching file in storage:", matchingFile.name);
          
          // Get the public URL
          const { data: urlData } = await supabase.storage
            .from('reports')
            .getPublicUrl(matchingFile.name);
            
          if (urlData?.publicUrl) {
            console.log("Found report in storage:", urlData.publicUrl);
            
            // Use the URL directly
            const link = document.createElement('a');
            link.href = urlData.publicUrl;
            link.download = `${getSafeFileName(lead)}-ChatSites-ROI-Report.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
              title: "Report Downloaded",
              description: "The report has been successfully downloaded from storage.",
              duration: 1000,
            });
            return;
          }
        }
      }
    } catch (storageCheckError) {
      console.error("Error checking storage:", storageCheckError);
    }
    
    // If no report found, notify the user that they need to generate one first
    console.log("No existing report found, notifying user to generate one first");
    setIsLoading(false);
    
    toast({
      title: "No Report Found",
      description: "There is no existing report for this lead. Please generate a report from the calculator data first.",
      variant: "destructive",
      duration: 3000,
    });
    
    console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ENDED ----------");
    
  } catch (error) {
    console.error("Error in findAndDownloadReport:", error);
    setIsLoading(false);
    throw error;
  }
}
