
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { generateAndUploadPDF } from "./pdfGeneration";
import { getSafeFileName } from "@/utils/report/validation";

// Find existing reports for a lead or generate new one
export const findOrGenerateReport = async (lead: Lead, setIsLoading: (isLoading: boolean) => void) => {
  try {
    console.log('---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------');
    console.log('Lead ID for report download:', lead.id);
    console.log('Lead calculator_inputs:', lead.calculator_inputs);
    console.log('Lead calculator_results:', lead.calculator_results);
    
    // Check if lead ID exists
    if (!lead.id) {
      throw new Error("Lead ID is missing");
    }
    
    // First, try to find the report in the database with a more streamlined approach
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
    
    if (reportResults && reportResults.length > 0) {
      const report = reportResults[0];
      console.log('Found report for lead:', report.id);
      
      // Look for stored PDF in Supabase storage
      const pdfFileName = `${report.id}.pdf`;
      console.log('Checking for PDF file:', pdfFileName);
      
      try {
        // Get the public URL directly
        const { data: urlData } = await supabase.storage
          .from('reports')
          .getPublicUrl(pdfFileName);
        
        if (urlData && urlData.publicUrl) {
          console.log('Found stored PDF, downloading from:', urlData.publicUrl);
          
          // Verify the URL is accessible
          try {
            const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
            
            if (response.ok) {
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
                description: "The original report has been successfully downloaded.",
                duration: 1000,
              });
              
              setIsLoading(false);
              return;
            } else {
              console.log(`PDF URL check failed with status ${response.status}. Generating new PDF.`);
            }
          } catch (checkError) {
            console.error("Error verifying PDF URL:", checkError);
          }
        }
      } catch (storageError) {
        console.error('Error checking stored PDF:', storageError);
      }
      
      // If stored PDF not found or not accessible, generate from report data
      console.log('No stored PDF found or not accessible, generating from report data');
      await generateAndUploadPDF(report, lead);
      setIsLoading(false);
      return;
    }
    
    // If no reports were found, generate a new one if we have calculator data
    if (lead.calculator_results) {
      console.log('No reports found, generating new report from lead data');
      
      // First, create a new report record in the database
      const reportId = crypto.randomUUID();
      
      const reportData = {
        id: reportId,
        lead_id: lead.id,
        contact_name: lead.name,
        company_name: lead.company_name,
        email: lead.email,
        phone_number: lead.phone_number || null,
        calculator_inputs: lead.calculator_inputs,
        calculator_results: lead.calculator_results,
        report_date: new Date().toISOString()
      };
      
      console.log("Creating new report in database:", reportData);
      
      const { data, error } = await supabase
        .from('generated_reports')
        .insert(reportData);
      
      if (error) {
        console.error('Error creating report in database:', error);
        // Continue with report generation even if saving to database fails
      }
      
      // Create a temporary report object
      const tempReport = {
        id: reportId,
        lead_id: lead.id,
        company_name: lead.company_name,
        contact_name: lead.name,
        email: lead.email,
        phone_number: lead.phone_number,
        calculator_inputs: lead.calculator_inputs,
        calculator_results: lead.calculator_results
      };
      
      await generateAndUploadPDF(tempReport, lead);
      setIsLoading(false);
      return;
    }
    
    // If we get here, no reports were found and no calculator data exists
    console.error('No reports found and no calculator data available for lead:', lead.id);
    
    toast({
      title: "No Report Available",
      description: "No report data was found for this lead. Please generate a report first.",
      variant: "warning",
    });
    
  } catch (error) {
    console.error("Error in findOrGenerateReport:", error);
    throw error; // Rethrow to be handled by the main hook
  }
};
