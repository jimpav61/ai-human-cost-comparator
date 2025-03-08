
import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { Button } from "@/components/ui/button";
import { FileBarChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { saveReportPDF } from "./hooks/report-generator/saveReport";
import { generatePDF } from "@/components/calculator/pdf";
import { supabase } from "@/integrations/supabase/client";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async () => {
    try {
      setIsLoading(true);
      
      // Check if there's a saved report in the database
      const { data: existingReport, error: reportError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
        
      if (reportError) {
        throw new Error("Error fetching report");
      }
      
      if (!existingReport) {
        throw new Error("No saved report found for this lead");
      }
      
      // Simply use the existing PDF generator with the exact saved data
      const doc = generatePDF(existingReport);
      
      // Save the document using the existing utility
      saveReportPDF(doc, lead);
      
      toast({
        title: "Success",
        description: `Saved report for ${lead.company_name || 'Client'} downloaded successfully`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download saved report. Please try again.",
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
