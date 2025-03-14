
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SavedReport {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone_number: string;
  report_date: string;
  calculator_inputs: any;
  calculator_results: any;
  lead_id: string | null;
  pdf_url?: string;
}

export const useSavedReports = (leadId?: string) => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    if (!leadId) return;
    
    setIsLoading(true);
    try {
      console.log("📊 REPORT FINDER: Starting search for lead ID:", leadId);
      
      // PRIORITY 1: Check storage for existing PDF file with the lead ID
      // This is the most direct and reliable method
      const { data: storageFiles, error: storageError } = await supabase
        .storage
        .from('reports')
        .list();
        
      if (storageError) {
        console.error("📊 REPORT FINDER: Error accessing 'reports' storage:", storageError);
      } else if (storageFiles && storageFiles.length > 0) {
        console.log("📊 REPORT FINDER: Checking storage files:", storageFiles.map(f => f.name));
        
        // Look for exact lead ID match in filenames
        const matchingFiles = storageFiles.filter(file => file.name.includes(leadId));
        
        if (matchingFiles.length > 0) {
          console.log(`📊 REPORT FINDER: Found ${matchingFiles.length} matches in storage`);
          
          const reportPromises = matchingFiles.map(async (file) => {
            // Get the public URL
            const { data: urlData } = await supabase.storage
              .from('reports')
              .getPublicUrl(file.name);
              
            if (urlData?.publicUrl) {
              // Create a report object from the file
              return {
                id: file.name.replace('.pdf', ''),
                company_name: "Report from Storage",
                contact_name: "Unknown",
                email: "",
                phone_number: "",
                report_date: new Date().toISOString(),
                calculator_inputs: {},
                calculator_results: {},
                lead_id: leadId,
                pdf_url: urlData.publicUrl
              } as SavedReport;
            }
            return null;
          });
          
          const foundReports = (await Promise.all(reportPromises)).filter(Boolean) as SavedReport[];
          
          if (foundReports.length > 0) {
            console.log(`📊 REPORT FINDER: Successfully processed ${foundReports.length} reports`);
            setReports(foundReports);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // PRIORITY 2: Check the database for reports with this lead ID
      const { data: leadIdMatches, error: leadIdError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('lead_id', leadId)
        .order('report_date', { ascending: false });
        
      if (leadIdError) {
        console.error("📊 REPORT FINDER: Error searching by lead_id:", leadIdError);
      } else if (leadIdMatches && leadIdMatches.length > 0) {
        console.log(`📊 REPORT FINDER: Found ${leadIdMatches.length} reports by lead_id match`);
        
        // For each database report, check if there's a corresponding PDF file
        const reportPromises = leadIdMatches.map(async (report) => {
          const pdfFileName = `${report.id}.pdf`;
          
          const { data: fileData } = await supabase.storage
            .from('reports')
            .getPublicUrl(pdfFileName);
            
          if (fileData?.publicUrl) {
            return {
              ...report,
              pdf_url: fileData.publicUrl
            } as SavedReport;
          }
          return report as SavedReport;
        });
        
        const processedReports = await Promise.all(reportPromises);
        setReports(processedReports);
        setIsLoading(false);
        return;
      }
      
      // At this point, no reports found for the lead ID
      console.log("📊 REPORT FINDER: No reports found with this lead ID");
      setReports([]);
      
    } catch (error) {
      console.error("📊 REPORT FINDER: Unexpected error:", error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchReports();
    }
  }, [leadId]);

  return {
    reports,
    isLoading,
    refreshReports: fetchReports
  };
};
