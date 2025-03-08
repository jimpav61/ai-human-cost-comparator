
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
      let { data: exactMatch, error: exactMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', leadId)
        .maybeSingle();
        
      if (exactMatchError) {
        console.error("Error fetching exact match report:", exactMatchError);
      }
      
      if (exactMatch) {
        console.log("Found exact match report by ID:", exactMatch);
        setReports([exactMatch]);
        return;
      }
      
      // If no exact match found, search by email in case lead ID is actually an email
      const { data: emailMatch, error: emailMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('email', leadId)
        .order('report_date', { ascending: false });
        
      if (emailMatchError) {
        console.error("Error fetching related reports by email:", emailMatchError);
      }
      
      if (emailMatch && emailMatch.length > 0) {
        console.log("Found email match reports:", emailMatch);
        setReports(emailMatch);
        return;
      }
      
      // As a fallback, try to find by company name
      const { data: companyMatch, error: companyMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .ilike('company_name', `%${leadId}%`)
        .order('report_date', { ascending: false });
        
      if (companyMatchError) {
        console.error("Error fetching related reports by company:", companyMatchError);
      }
      
      if (companyMatch && companyMatch.length > 0) {
        console.log("Found company match reports:", companyMatch);
        setReports(companyMatch);
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
