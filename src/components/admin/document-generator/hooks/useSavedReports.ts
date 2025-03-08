
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
      console.log("Fetching saved reports for lead ID:", leadId);
      
      // First try to find reports by lead ID directly (both in id field and email field)
      const { data: allReports, error: reportsError } = await supabase
        .from('generated_reports')
        .select('*')
        .or(`id.eq.${leadId},email.eq.${leadId}`);
        
      if (reportsError) {
        console.error("Error fetching reports by ID:", reportsError);
        toast({
          title: "Error",
          description: "Failed to fetch reports. Please try again.",
          variant: "destructive",
        });
        setReports([]);
        setIsLoading(false);
        return;
      }
      
      console.log("Found reports:", allReports);
      
      if (allReports && allReports.length > 0) {
        // Process and type reports properly
        const typedReports: SavedReport[] = allReports.map(report => ({
          ...report,
          calculator_inputs: typeof report.calculator_inputs === 'string' 
            ? JSON.parse(report.calculator_inputs as string) 
            : (report.calculator_inputs as Record<string, any>),
          calculator_results: typeof report.calculator_results === 'string'
            ? JSON.parse(report.calculator_results as string)
            : (report.calculator_results as Record<string, any>)
        }));
        
        setReports(typedReports);
        console.log("Processed reports:", typedReports);
      } else {
        // If no reports found using direct ID, try querying by lead email from another source
        // Fetch the lead info first to get email
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('email')
          .eq('id', leadId)
          .single();
          
        if (leadError) {
          console.error("Error fetching lead email:", leadError);
          setReports([]);
          setIsLoading(false);
          return;
        }
        
        if (leadData?.email) {
          // Search for reports using the lead's email
          const { data: emailReports, error: emailError } = await supabase
            .from('generated_reports')
            .select('*')
            .eq('email', leadData.email);
            
          if (emailError) {
            console.error("Error fetching reports by email:", emailError);
            setReports([]);
          } else if (emailReports && emailReports.length > 0) {
            // Process and type reports properly
            const typedReports: SavedReport[] = emailReports.map(report => ({
              ...report,
              calculator_inputs: typeof report.calculator_inputs === 'string' 
                ? JSON.parse(report.calculator_inputs as string) 
                : (report.calculator_inputs as Record<string, any>),
              calculator_results: typeof report.calculator_results === 'string'
                ? JSON.parse(report.calculator_results as string)
                : (report.calculator_results as Record<string, any>)
            }));
            
            setReports(typedReports);
            console.log("Found reports by email:", typedReports);
          } else {
            console.log("No reports found for lead ID or email:", leadId, leadData.email);
            setReports([]);
          }
        } else {
          console.log("No email found for lead ID:", leadId);
          setReports([]);
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
      toast({
        title: "Error",
        description: "Failed to load saved reports. Please try again.",
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
