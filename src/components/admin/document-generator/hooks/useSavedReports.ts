
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
  lead_id: string; // Make sure this field is included
}

export const useSavedReports = (leadId?: string) => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    if (!leadId) return;
    
    setIsLoading(true);
    try {
      console.log("Fetching saved reports for lead ID:", leadId);
      
      // Query directly by lead_id first - this is the most reliable approach
      const { data: leadIdMatch, error: leadIdError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('lead_id', leadId)
        .order('report_date', { ascending: false });
        
      if (leadIdError) {
        console.error("Error fetching reports by lead_id:", leadIdError);
      }
      
      if (leadIdMatch && leadIdMatch.length > 0) {
        console.log("Found reports by lead_id:", leadIdMatch.length);
        setReports(leadIdMatch);
        setIsLoading(false);
        return;
      }
      
      // If no match by lead_id, then check if the ID we have is actually a report ID
      const { data: exactMatch, error: exactMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', leadId)
        .maybeSingle();
        
      if (exactMatchError) {
        console.error("Error fetching report by id:", exactMatchError);
      }
      
      if (exactMatch) {
        console.log("Found report by direct ID:", exactMatch);
        setReports([exactMatch]);
        setIsLoading(false);
        return;
      }
      
      // If no matches yet, try email as fallback
      const { data: emailMatch, error: emailMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('email', leadId)
        .order('report_date', { ascending: false });
        
      if (emailMatchError) {
        console.error("Error fetching reports by email:", emailMatchError);
      }
      
      if (emailMatch && emailMatch.length > 0) {
        console.log("Found reports by email:", emailMatch.length);
        setReports(emailMatch);
        setIsLoading(false);
        return;
      }
      
      // Last resort: try company name as fuzzy match
      const { data: companyMatch, error: companyMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .ilike('company_name', `%${leadId}%`)
        .order('report_date', { ascending: false });
        
      if (companyMatchError) {
        console.error("Error fetching reports by company name:", companyMatchError);
      }
      
      if (companyMatch && companyMatch.length > 0) {
        console.log("Found reports by company name:", companyMatch.length);
        setReports(companyMatch);
      } else {
        console.log("No reports found for lead:", leadId);
        setReports([]);
      }
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
