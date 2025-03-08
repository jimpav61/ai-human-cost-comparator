
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
  calculator_inputs: Record<string, any>;
  calculator_results: Record<string, any>;
}

export const useSavedReports = (leadId?: string) => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    if (!leadId) return;
    
    setIsLoading(true);
    try {
      console.log("Fetching saved reports for lead:", leadId);
      
      // First try to find a report with lead ID
      const { data: exactMatch, error: exactMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', leadId)
        .maybeSingle();
        
      if (exactMatchError) {
        console.error("Error fetching exact match report:", exactMatchError);
      }
      
      if (exactMatch) {
        console.log("Found exact match report by ID:", exactMatch);
        
        // Ensure proper typing of calculator inputs and results
        const typedReport: SavedReport = {
          ...exactMatch,
          calculator_inputs: exactMatch.calculator_inputs as Record<string, any>,
          calculator_results: exactMatch.calculator_results as Record<string, any>
        };
        
        setReports([typedReport]);
        return;
      }
      
      // If no exact match found, search by report data
      const { data: relatedReports, error: relatedError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('email', leadId) // Try finding by email (stored in ID field)
        .order('report_date', { ascending: false });
        
      if (relatedError) {
        console.error("Error fetching related reports:", relatedError);
      }
      
      if (relatedReports && relatedReports.length > 0) {
        console.log("Found related reports:", relatedReports);
        
        // Ensure proper typing for all reports
        const typedReports: SavedReport[] = relatedReports.map(report => ({
          ...report,
          calculator_inputs: report.calculator_inputs as Record<string, any>,
          calculator_results: report.calculator_results as Record<string, any>
        }));
        
        setReports(typedReports);
        return;
      }
      
      console.log("No reports found for lead:", leadId);
      setReports([]);
    } catch (error) {
      console.error("Error fetching reports:", error);
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
