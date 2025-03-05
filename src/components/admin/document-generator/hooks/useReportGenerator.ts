
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { useDownloadState } from "./useDownloadState";
import { processLeadData } from "./report-generator/processLeadData";
import { generateReportPDF } from "./report-generator/generateReportPDF";
import { saveReportPDF } from "./report-generator/saveReport";

interface UseReportGeneratorProps {
  lead: Lead;
}

export const useReportGenerator = ({ lead }: UseReportGeneratorProps) => {
  const { hasDownloaded, markAsDownloaded } = useDownloadState({
    storageKey: 'downloadedReports',
    leadId: lead.id
  });

  const generateReportDocument = async () => {
    try {
      console.log('Generating report for lead:', lead);
      
      // Check if lead exists
      if (!lead) {
        throw new Error("Lead data is missing");
      }
      
      // Process the lead data with more detailed error handling
      let processedData;
      try {
        processedData = processLeadData(lead);
        console.log("Processed lead data:", processedData);
      } catch (processError) {
        console.error("Error processing lead data:", processError);
        throw new Error(`Failed to process lead data: ${processError instanceof Error ? processError.message : 'Unknown error'}`);
      }
      
      try {
        // Generate the PDF
        const doc = generateReportPDF(processedData);
        
        // Save the PDF
        saveReportPDF(doc, lead);
        
        // Mark as downloaded
        markAsDownloaded();

        toast({
          title: "Success",
          description: "Report generated and downloaded successfully",
        });
      } catch (error) {
        console.error("Error in document generation step:", error);
        toast({
          title: "Error",
          description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        throw error;
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Error",
        description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return {
    hasDownloaded,
    generateReportDocument
  };
};
