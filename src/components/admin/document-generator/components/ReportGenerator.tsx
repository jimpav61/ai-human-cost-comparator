
import { Lead } from "@/types/leads";
import { Download } from "lucide-react";
import { DownloadButton } from "./DownloadButton";
import { LargeReportButton } from "./LargeReportButton";
import { useDownloadState } from "../hooks/useDownloadState";
import { generateAndDownloadReport } from "@/utils/reportGenerator";
import { toast } from "@/hooks/use-toast";

interface ReportGeneratorProps {
  lead: Lead;
  buttonStyle?: "default" | "large";
}

export const ReportGenerator = ({ lead, buttonStyle = "default" }: ReportGeneratorProps) => {
  const { hasDownloaded, markAsDownloaded } = useDownloadState({
    storageKey: 'downloadedReports',
    leadId: lead.id
  });

  const generateReportDocument = async () => {
    try {
      // Use the shared report generation function
      const success = generateAndDownloadReport(lead);
      
      // Mark as downloaded if successful
      if (success) {
        markAsDownloaded();
      }
    } catch (error) {
      console.error('[REPORT] Report generation error:', error);
      toast({
        title: "Error",
        description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Return different button styles based on the buttonStyle prop
  if (buttonStyle === "large") {
    return (
      <LargeReportButton 
        hasDownloaded={hasDownloaded} 
        onClick={generateReportDocument} 
      />
    );
  }

  // Default button style for admin interface
  return (
    <DownloadButton
      hasDownloaded={hasDownloaded}
      label="Report"
      downloadedLabel="Download"
      icon={<Download className="h-4 w-4 mr-1" />}
      onClick={generateReportDocument}
    />
  );
};
