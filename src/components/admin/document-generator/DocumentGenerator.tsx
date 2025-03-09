
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
      console.log("Using lead ID only:", lead.id);
      
      // Only lookup by exact ID - no fallbacks
      const { data: existingReport, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!existingReport) {
        throw new Error("No report exists for this lead ID. Complete the calculator form first.");
      }
      
      console.log("Found report by lead ID");
      
      // Use the shared utility function to download the report
      const success = await generateAndDownloadReport(lead);
      
      if (!success) {
        throw new Error("Failed to download the report. Please try again.");
      }
      
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
