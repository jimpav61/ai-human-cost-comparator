
import { Lead } from "@/types/leads";
import { FileBarChart } from "lucide-react";
import { DownloadButton } from "./DownloadButton";
import { useDownloadState } from "../hooks/useDownloadState";
import { useReportDownload } from "../hooks/useReportDownload";

interface ReportGeneratorProps {
  lead: Lead;
}

export const ReportGenerator = ({ lead }: ReportGeneratorProps) => {
  const { hasDownloaded, markAsDownloaded } = useDownloadState({ id: `report-${lead.id}` });
  const { isLoading, handleDownloadReport } = useReportDownload();
  
  const handleGenerateReport = async () => {
    try {
      console.log("Downloading ROI analysis report for lead:", lead.name);
      await handleDownloadReport(lead);
      markAsDownloaded();
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  return (
    <DownloadButton
      hasDownloaded={hasDownloaded}
      label="ROI Report"
      downloadedLabel="Report Downloaded"
      icon={<FileBarChart className="h-4 w-4 mr-1" />}
      onClick={handleGenerateReport}
      className="bg-emerald-600 hover:bg-emerald-700"
      loading={isLoading}
    />
  );
};
