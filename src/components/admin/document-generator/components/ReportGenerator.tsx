
import { Lead } from "@/types/leads";
import { Download } from "lucide-react";
import { DownloadButton } from "./DownloadButton";
import { LargeReportButton } from "./LargeReportButton";
import { useReportGenerator } from "../hooks/useReportGenerator";

interface ReportGeneratorProps {
  lead: Lead;
  buttonStyle?: "default" | "large";
}

export const ReportGenerator = ({ lead, buttonStyle = "default" }: ReportGeneratorProps) => {
  const { hasDownloaded, generateReportDocument } = useReportGenerator({ lead });

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
