
import { Lead } from "@/types/leads";
import { FileBarChart } from "lucide-react";
import { DownloadButton } from "./DownloadButton";
import { generateAndDownloadReport } from "@/utils/report/generateReport";
import { useDownloadState } from "../hooks/useDownloadState";

interface ReportGeneratorProps {
  lead: Lead;
}

export const ReportGenerator = ({ lead }: ReportGeneratorProps) => {
  const { hasDownloaded, markAsDownloaded } = useDownloadState({ id: `report-${lead.id}` });

  const handleGenerateReport = () => {
    try {
      console.log("Generating ROI analysis report for lead:", lead.name);
      const success = generateAndDownloadReport(lead);
      if (success) {
        markAsDownloaded();
      }
    } catch (error) {
      console.error("Error generating report:", error);
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
    />
  );
};
