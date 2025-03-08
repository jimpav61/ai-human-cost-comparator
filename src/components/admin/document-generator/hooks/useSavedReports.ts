
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
      console.log("Attempting to fetch saved reports with lead ID:", leadId);
      
      // First try to find reports that match the lead ID exactly
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
        setReports([exactMatch]);
      } else {
        // If we can't find by direct ID, fetch lead information to get email/company
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('email, company_name')
          .eq('id', leadId)
          .single();
          
        if (leadError) {
          console.error("Error fetching lead data:", leadError);
          throw leadError;
        }
        
        if (!leadData) {
          console.log("No lead data found for ID:", leadId);
          setReports([]);
          return;
        }
        
        console.log("Found lead data:", leadData);
        
        // Now search for reports with matching email and company name
        const { data: reportsByEmail, error: emailError } = await supabase
          .from('generated_reports')
          .select('*')
          .eq('email', leadData.email)
          .eq('company_name', leadData.company_name);
          
        if (emailError) {
          console.error("Error fetching reports by email/company:", emailError);
          throw emailError;
        }
        
        console.log("Found reports by email/company:", reportsByEmail?.length || 0);
        
        if (reportsByEmail && reportsByEmail.length > 0) {
          // Sort by most recent first
          const sortedReports = reportsByEmail.sort((a, b) => 
            new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
          );
          setReports(sortedReports);
        } else {
          setReports([]);
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to fetch saved reports",
        variant: "destructive",
      });
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
