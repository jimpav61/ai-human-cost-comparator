
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
      
      // Search STRICTLY by the lead ID only for testing purposes
      const { data: existingReports, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .limit(1);
      
      if (error) {
        console.error("Error checking for existing report:", error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log("Existing reports query result:", existingReports);
      
      // If no report exists, inform the user they need to generate one first
      if (!existingReports || existingReports.length === 0) {
        console.log("No existing report found for lead ID:", lead.id);
        throw new Error("No report exists for this lead. Complete the calculator form first.");
      }
      
      const existingReport = existingReports[0];
      console.log("Found existing report in database with ID:", existingReport.id);
      
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
