
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Lead } from "@/types/leads";

export interface SavedReport {
  id: string;
  company_name: string;
  contact_name: string;
  report_date: string;
  calculator_inputs: any;
  calculator_results: any;
}

export const useSavedReports = (leadId?: string) => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('generated_reports').select('*');
      
      // If leadId is provided, filter reports by that lead
      if (leadId) {
        // First get the lead data
        const { data: lead } = await supabase
          .from('leads')
          .select('email, company_name')
          .eq('id', leadId)
          .single();
          
        if (lead) {
          query = query
            .eq('email', lead.email)
            .eq('company_name', lead.company_name);
        }
      }
      
      const { data, error } = await query.order('report_date', { ascending: false });
      
      if (error) throw error;
      
      console.log("Fetched reports data:", data);
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
    fetchReports();
  }, [leadId]);

  return {
    reports,
    isLoading,
    refreshReports: fetchReports
  };
};
