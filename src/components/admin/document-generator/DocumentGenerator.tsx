
import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { Button } from "@/components/ui/button";
import { FileBarChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generatePDF } from "@/components/calculator/pdf";
import { getSafeFileName } from "./hooks/report-generator/saveReport";
import { CalculationResults } from "@/hooks/calculator/types";
import { generateAndDownloadReport } from "@/utils/reportGenerator";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async () => {
    try {
      setIsLoading(true);
      console.log("Attempting to download report for lead:", lead);
      
      // Simply use the shared utility function without any checks
      // The utility function will handle finding the saved report
      const success = await generateAndDownloadReport(lead);
      
      if (!success) {
        throw new Error("No report found for this lead");
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
