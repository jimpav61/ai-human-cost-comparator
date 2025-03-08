
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Lead } from "@/types/leads";

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
      // First get the lead data to ensure we get the correct email and company_name
      const { data: lead } = await supabase
        .from('leads')
        .select('email, company_name')
        .eq('id', leadId)
        .single();
          
      if (!lead) {
        console.error("Lead not found:", leadId);
        setReports([]);
        return;
      }
      
      // Now query the generated_reports table for reports matching this lead's email and company
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('email', lead.email)
        .eq('company_name', lead.company_name)
        .order('report_date', { ascending: false });
      
      if (error) throw error;
      
      console.log("Fetched reports data for lead:", leadId, "reports:", data);
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to fetch saved reports",
        variant: "destructive",
      });
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
