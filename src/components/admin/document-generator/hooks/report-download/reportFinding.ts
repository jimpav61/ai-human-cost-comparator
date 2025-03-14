
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
    // First attempt: Query reports table for reports associated with this lead
    console.log("Searching for report with lead_id:", lead.id);
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
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
      const { data: storageFiles, error: storageError } = await supabase
        .storage
        .from('reports')
        .list();
        
      if (storageError) {
        console.error("Error listing storage files:", storageError);
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
        
        console.log("No file found in storage with name pattern:", lead.id + ".pdf");
      }
    } catch (storageCheckError) {
      console.error("Error checking storage:", storageCheckError);
    }
    
    // Final attempt: Generate new report from the lead data
    console.log("No existing report found, generating new report from lead data");
    
    // Verify the lead data contains calculator results
    if (!lead.calculator_results || !lead.calculator_inputs) {
      throw new Error("Lead does not have calculator results. Please add calculator data first.");
    }
    
    // Create a new report record in the database
    const safeCompanyName = getSafeFileName(lead);
    const reportId = Math.random().toString(36).substring(2, 15);
    
    console.log("Creating new report in database with ID:", reportId);
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        id: reportId,
        lead_id: lead.id,
        company_name: lead.company_name,
        contact_name: lead.name,
        email: lead.email,
        phone_number: lead.phone_number,
        calculator_results: lead.calculator_results,
        calculator_inputs: lead.calculator_inputs,
        report_date: new Date().toISOString()
      });
      
    if (insertError) {
      console.error("Error creating report record:", insertError);
      console.log("Continuing with report generation despite record creation error");
    }
    
    // Generate the PDF with the lead data
    console.log("Generating PDF from lead data");
    await generateAndUploadPDF({
      id: reportId,
      lead_id: lead.id,
      company_name: lead.company_name,
      contact_name: lead.name,
      email: lead.email,
      phone_number: lead.phone_number,
      calculator_results: lead.calculator_results,
      calculator_inputs: lead.calculator_inputs
    }, lead);
    
    console.log("Successfully generated and downloaded report");
    
  } catch (error) {
    console.error("Error in findAndDownloadReport:", error);
    setIsLoading(false);
    throw error;
  }
}
