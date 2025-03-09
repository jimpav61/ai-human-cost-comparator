
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
      console.log("Attempting to download report for lead ID:", lead.id);
      console.log("Lead email:", lead.email);
      
      // Try multiple ways to find the report - first by ID, then by email if that fails
      let existingReports;
      let error;
      
      // First try: Look up by lead ID (which should match the report ID if created properly)
      const idLookup = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .limit(1);
      
      console.log("ID lookup result:", idLookup);
      
      if (idLookup.error) {
        console.error("Error checking for existing report by ID:", idLookup.error);
        error = idLookup.error;
      } else if (idLookup.data && idLookup.data.length > 0) {
        existingReports = idLookup.data;
        console.log("Found report by ID match");
      } else {
        // Second try: If ID lookup fails, try by email
        console.log("No report found by ID, trying email lookup");
        const emailLookup = await supabase
          .from('generated_reports')
          .select('*')
          .eq('email', lead.email)
          .order('report_date', { ascending: false })
          .limit(1);
        
        console.log("Email lookup result:", emailLookup);
        
        if (emailLookup.error) {
          console.error("Error checking for existing report by email:", emailLookup.error);
          error = error || emailLookup.error; // Keep the first error if both failed
        } else if (emailLookup.data && emailLookup.data.length > 0) {
          existingReports = emailLookup.data;
          console.log("Found report by email match");
        } else {
          console.log("No report found by email either");
        }
      }
      
      // If we still have an error, throw it
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      // If no report exists after trying both methods, inform the user
      if (!existingReports || existingReports.length === 0) {
        console.log("No existing report found for lead after trying both ID and email lookup");
        throw new Error("No report exists for this lead. Complete the calculator form first.");
      }
      
      const existingReport = existingReports[0];
      console.log("Found existing report in database:", existingReport);
      
      // Use the shared utility function to download the report
      const success = await generateAndDownloadReport(lead);
      
      if (!success) {
        throw new Error("Failed to download the report. Please try again.");
      }
      
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
