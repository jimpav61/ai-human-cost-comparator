
import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { Button } from "@/components/ui/button";
import { FileBarChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { generateAndDownloadReport } from "@/utils/reportGenerator";
import { supabase } from "@/integrations/supabase/client";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async () => {
    try {
      setIsLoading(true);
      
      // First check if report exists in database to provide better user feedback
      const { data: existingReport, error: reportError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
        
      if (reportError) {
        console.error("Error checking for existing report:", reportError);
      }
      
      // Use the shared utility that works in both frontend and admin
      const success = await generateAndDownloadReport(lead);
      
      if (!success) {
        throw new Error(existingReport ? "Failed to download existing report" : "Failed to generate report");
      }
      
      const message = existingReport 
        ? "Downloaded saved report successfully" 
        : "Generated and downloaded report successfully";
      
      toast({
        title: "Success",
        description: message,
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
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
