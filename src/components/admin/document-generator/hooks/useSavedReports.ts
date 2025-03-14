
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
      
      // Ensure we have a clean lead ID for consistent searching
      const exactLeadId = leadId.trim();
      console.log("📊 REPORT FINDER: Using exact lead ID for matching:", exactLeadId);
      
      // HIGHEST PRIORITY: First check storage for exact lead ID match
      const { data: storageFiles, error: storageError } = await supabase
        .storage
        .from('reports')
        .list();
        
      if (storageError) {
        console.error("📊 REPORT FINDER: Error accessing 'reports' storage:", storageError);
      } else if (storageFiles && storageFiles.length > 0) {
        console.log("📊 REPORT FINDER: Found", storageFiles.length, "files in reports bucket");
        console.log("📊 REPORT FINDER: Checking storage files for EXACT lead ID match:", exactLeadId);
        
        // STRICT MATCHING: Only look for files that have the exact lead ID in the filename
        const matchingFiles = storageFiles.filter(file => {
          const containsExactId = file.name.includes(exactLeadId);
          console.log(`📊 File ${file.name} contains lead ID ${exactLeadId}? ${containsExactId}`);
          return containsExactId;
        });
        
        if (matchingFiles.length > 0) {
          console.log(`📊 REPORT FINDER: Found ${matchingFiles.length} exact ID matches in storage:`, 
            matchingFiles.map(f => f.name));
          
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
                lead_id: exactLeadId,
                pdf_url: urlData.publicUrl
              } as SavedReport;
            }
            return null;
          });
          
          const foundReports = (await Promise.all(reportPromises)).filter(Boolean) as SavedReport[];
          
          if (foundReports.length > 0) {
            console.log(`📊 REPORT FINDER: Successfully processed ${foundReports.length} reports with exact ID match`);
            setReports(foundReports);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // PRIORITY 2: Check the database for reports with this exact lead ID
      console.log("📊 REPORT FINDER: No exact matches in storage, checking database for lead_id:", exactLeadId);
      const { data: leadIdMatches, error: leadIdError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('lead_id', exactLeadId)
        .order('report_date', { ascending: false });
        
      if (leadIdError) {
        console.error("📊 REPORT FINDER: Error searching by lead_id:", leadIdError);
      } else if (leadIdMatches && leadIdMatches.length > 0) {
        console.log(`📊 REPORT FINDER: Found ${leadIdMatches.length} reports by lead_id match in database`);
        
        // For each database report, check if there's a corresponding PDF file
        const reportPromises = leadIdMatches.map(async (report) => {
          // Try with report.id first (most likely filename)
          let pdfFileName = `${report.id}.pdf`;
          
          // Check if the file exists with report.id
          const { data: fileData } = await supabase.storage
            .from('reports')
            .getPublicUrl(pdfFileName);
            
          if (fileData?.publicUrl) {
            return {
              ...report,
              pdf_url: fileData.publicUrl
            } as SavedReport;
          }
          
          // If no file found with report.id, try with lead_id
          pdfFileName = `${report.lead_id}.pdf`;
          const { data: leadIdFileData } = await supabase.storage
            .from('reports')
            .getPublicUrl(pdfFileName);
            
          if (leadIdFileData?.publicUrl) {
            return {
              ...report,
              pdf_url: leadIdFileData.publicUrl
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
      console.log("📊 REPORT FINDER: No reports found with this lead ID:", exactLeadId);
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
