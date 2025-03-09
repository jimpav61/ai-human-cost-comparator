
import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { Button } from "@/components/ui/button";
import { FileBarChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSafeFileName } from "./hooks/report-generator/saveReport";
import { generateAndDownloadReport } from "@/utils/reportGenerator";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async () => {
    try {
      setIsLoading(true);
      console.log("---------- REPORT DOWNLOAD ATTEMPT ----------");
      console.log("Lead details:", {
        id: lead.id,
        email: lead.email,
        company: lead.company_name,
        name: lead.name
      });
      
      // Try multiple ways to find the report
      let existingReports;
      let error;
      
      // First try: Exact ID match (most reliable if IDs are consistent)
      const idLookup = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .limit(1);
      
      console.log("ID lookup result:", {
        error: idLookup.error ? idLookup.error.message : null,
        count: idLookup.data ? idLookup.data.length : 0
      });
      
      if (idLookup.error) {
        console.error("Error checking for existing report by ID:", idLookup.error);
        error = idLookup.error;
      } else if (idLookup.data && idLookup.data.length > 0) {
        existingReports = idLookup.data;
        console.log("Found report by exact ID match");
      } else {
        // Second try: Email lookup
        console.log("No report found by ID, trying email lookup");
        const emailLookup = await supabase
          .from('generated_reports')
          .select('*')
          .eq('email', lead.email)
          .order('report_date', { ascending: false })
          .limit(1);
        
        console.log("Email lookup result:", {
          error: emailLookup.error ? emailLookup.error.message : null,
          count: emailLookup.data ? emailLookup.data.length : 0
        });
        
        if (emailLookup.error) {
          console.error("Error checking for existing report by email:", emailLookup.error);
          error = error || emailLookup.error;
        } else if (emailLookup.data && emailLookup.data.length > 0) {
          existingReports = emailLookup.data;
          console.log("Found report by email match");
        } else {
          // Third try: Company name as fallback
          console.log("No report found by email either, trying company name lookup");
          const companyLookup = await supabase
            .from('generated_reports')
            .select('*')
            .eq('company_name', lead.company_name)
            .order('report_date', { ascending: false })
            .limit(1);
            
          console.log("Company name lookup result:", {
            error: companyLookup.error ? companyLookup.error.message : null,
            count: companyLookup.data ? companyLookup.data.length : 0
          });
          
          if (companyLookup.error) {
            console.error("Error checking for existing report by company:", companyLookup.error);
            error = error || companyLookup.error;
          } else if (companyLookup.data && companyLookup.data.length > 0) {
            existingReports = companyLookup.data;
            console.log("Found report by company name match");
          } else {
            console.log("No report found by any lookup method");
            
            // Debug: List all reports in the system for troubleshooting
            const allReports = await supabase
              .from('generated_reports')
              .select('id, email, company_name')
              .limit(10);
              
            console.log("Available reports in system:", allReports.data || "No reports found");
          }
        }
      }
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!existingReports || existingReports.length === 0) {
        throw new Error("No report exists for this lead. Complete the calculator form first.");
      }
      
      const existingReport = existingReports[0];
      console.log("Found existing report:", {
        id: existingReport.id,
        email: existingReport.email,
        company: existingReport.company_name,
        date: existingReport.report_date
      });
      
      // Use the shared utility function to download the report
      console.log("Attempting to generate and download report...");
      const success = await generateAndDownloadReport(lead);
      
      if (!success) {
        throw new Error("Failed to download the report. Please try again.");
      }
      
      console.log("Report download successful!");
      toast({
        title: "Report Downloaded",
        description: "The report has been successfully downloaded.",
      });
      
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Report Not Found",
        description: error instanceof Error 
          ? error.message 
          : "No report exists for this lead or there was an error accessing it.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("---------- REPORT DOWNLOAD ATTEMPT ENDED ----------");
    }
  };
  
  return (
    <Button
      onClick={handleDownloadReport}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center"
    >
      <FileBarChart className="h-4 w-4 mr-2" />
      {isLoading ? "Downloading..." : "Download Report"}
    </Button>
  );
};
