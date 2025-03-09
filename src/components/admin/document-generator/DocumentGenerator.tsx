
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
      
      // STRICTLY only lookup by exact ID - no fallbacks
      const { data: existingReport, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log("Database query response:", existingReport ? "Report found" : "No report found");
      
      if (!existingReport) {
        // If no report found, generate one immediately with the lead data
        console.log("Attempting to generate new report with lead data");
        
        // Check if lead has calculator results to generate a report
        if (!lead.calculator_results || Object.keys(lead.calculator_results).length === 0) {
          throw new Error("No report exists for this lead ID. Complete the calculator form first.");
        }
        
        // Use the shared utility function to generate and download the report
        const success = await generateAndDownloadReport(lead);
        
        if (!success) {
          throw new Error("Failed to generate a new report. Please try again.");
        }
        
        console.log("Successfully generated new report");
        
        toast({
          title: "Report Generated and Downloaded",
          description: "The report has been generated and downloaded successfully.",
        });
      } else {
        console.log("Found report by lead ID:", existingReport.id);
        
        // Use the shared utility function to download the report
        const success = await generateAndDownloadReport(lead);
        
        if (!success) {
          throw new Error("Failed to download the report. Please try again.");
        }
        
        toast({
          title: "Report Downloaded",
          description: "The report has been successfully downloaded.",
        });
      }
      
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
