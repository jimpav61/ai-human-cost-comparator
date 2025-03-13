
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
  lead_id: string | null; // Updated to allow null since some existing reports might not have lead_id
  pdf_url?: string; // Add field for PDF URL if available
}

export const useSavedReports = (leadId?: string) => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    if (!leadId) return;
    
    setIsLoading(true);
    try {
      console.log("📊 REPORT FINDER: Starting search for lead ID:", leadId);
      
      // Try all possible ways to find the report, capturing all results first
      const searchResults = [];
      
      // 1. Try direct lead_id match
      const { data: leadIdMatches, error: leadIdError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('lead_id', leadId)
        .order('report_date', { ascending: false });
        
      if (leadIdError) {
        console.error("📊 REPORT FINDER: Error searching by lead_id:", leadIdError);
      } else if (leadIdMatches && leadIdMatches.length > 0) {
        console.log(`📊 REPORT FINDER: Found ${leadIdMatches.length} reports by lead_id match`);
        searchResults.push(...leadIdMatches);
      }
      
      // 2. Try exact id match (report id = lead id)
      const { data: exactMatch, error: exactMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', leadId)
        .maybeSingle();
        
      if (exactMatchError) {
        console.error("📊 REPORT FINDER: Error searching by report id:", exactMatchError);
      } else if (exactMatch) {
        console.log("📊 REPORT FINDER: Found report by direct ID match");
        if (!searchResults.some(r => r.id === exactMatch.id)) {
          searchResults.push(exactMatch);
        }
      }
      
      // 3. Try matching by email (for legacy reports)
      const { data: emailMatches, error: emailMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('email', leadId)
        .order('report_date', { ascending: false });
        
      if (emailMatchError) {
        console.error("📊 REPORT FINDER: Error searching by email:", emailMatchError);
      } else if (emailMatches && emailMatches.length > 0) {
        console.log(`📊 REPORT FINDER: Found ${emailMatches.length} reports by email match`);
        // Avoid duplicates
        emailMatches.forEach(match => {
          if (!searchResults.some(r => r.id === match.id)) {
            searchResults.push(match);
          }
        });
      }
      
      // 4. Try fuzzy company name match as last resort
      const { data: companyMatches, error: companyMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .ilike('company_name', `%${leadId}%`)
        .order('report_date', { ascending: false });
        
      if (companyMatchError) {
        console.error("📊 REPORT FINDER: Error searching by company name:", companyMatchError);
      } else if (companyMatches && companyMatches.length > 0) {
        console.log(`📊 REPORT FINDER: Found ${companyMatches.length} reports by company name match`);
        // Avoid duplicates
        companyMatches.forEach(match => {
          if (!searchResults.some(r => r.id === match.id)) {
            searchResults.push(match);
          }
        });
      }
      
      // Also check storage for PDF files
      if (searchResults.length > 0) {
        // Check for stored PDF files for each report
        for (const report of searchResults) {
          try {
            const pdfFileName = `reports/${report.id}.pdf`;
            
            // Check if file exists in storage
            const { data: fileData, error: fileError } = await supabase.storage
              .from('reports')
              .getPublicUrl(pdfFileName);
            
            if (!fileError && fileData) {
              console.log(`📊 REPORT FINDER: Found stored PDF for report ${report.id}`);
              report.pdf_url = fileData.publicUrl;
            }
          } catch (fileCheckError) {
            console.error("Error checking for PDF file:", fileCheckError);
          }
        }
      }
      
      // Show search summary
      if (searchResults.length > 0) {
        console.log(`📊 REPORT FINDER: Search complete. Found ${searchResults.length} total reports.`);
        setReports(searchResults);
      } else {
        // If no matches, log a comprehensive debug message
        console.log("📊 REPORT FINDER: No reports found for this lead. Debug info:");
        console.log("- Lead ID searched:", leadId);
        
        // Query for all reports to help with debugging
        const { data: allReports } = await supabase
          .from('generated_reports')
          .select('id, lead_id, company_name, email')
          .limit(10);
          
        console.log("- Sample of reports in database:", allReports);
        setReports([]);
      }
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
