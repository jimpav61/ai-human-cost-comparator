
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
      
      // First check if there's a saved report in the database for this exact lead ID
      const { data: existingReport, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking for existing report:", error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      // If we found a report in the database, download it directly
      if (existingReport) {
        console.log("Found existing report in database with ID:", existingReport.id);
        
        // Generate and download the report using the existing data
        const success = await generateAndDownloadReport(lead);
        
        if (!success) {
          throw new Error("Failed to download existing report");
        }
        
        toast({
          title: "Success",
          description: `Downloaded report for ${lead.company_name || 'Client'}`,
          variant: "default",
        });
        
        return;
      }
      
      // If no saved report exists but the lead has calculator data, generate a new one
      if (lead.calculator_results && Object.keys(lead.calculator_results).length > 0) {
        console.log("No saved report found, but lead has calculator data. Generating new report for ID:", lead.id);
        
        const success = await generateAndDownloadReport(lead);
        
        if (!success) {
          throw new Error("Failed to generate and download report");
        }
        
        toast({
          title: "Success",
          description: `Generated and downloaded report for ${lead.company_name || 'Client'}`,
          variant: "default",
        });
        
        return;
      }
      
      // If we reach here, no report exists and no calculator data is available
      throw new Error("No report exists for this lead. Complete the calculator form first.");
      
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
