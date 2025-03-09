
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
      console.log("Using lead ID:", lead.id);
      console.log("Full lead object:", JSON.stringify(lead));
      
      // Verify lead has calculator data before proceeding
      if (!lead.calculator_results || Object.keys(lead.calculator_results).length === 0) {
        throw new Error("No calculator data found for this lead. Complete the calculator form first.");
      }
      
      // Check for existing report with exact lead ID match
      const { data: existingReport, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log("Database query response:", existingReport ? "Report found" : "No report found");
      
      // Use the shared utility function to generate and download the report
      // This will save a new report if one doesn't exist yet
      const success = await generateAndDownloadReport(lead);
      
      if (!success) {
        throw new Error("Failed to generate or download the report. Please try again.");
      }
      
      toast({
        title: existingReport ? "Report Downloaded" : "Report Generated and Downloaded",
        description: existingReport 
          ? "The report has been successfully downloaded." 
          : "A new report has been generated and downloaded successfully.",
      });
      
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Report Not Found",
        description: error instanceof Error 
          ? error.message 
          : "No report exists for this lead ID.",
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
