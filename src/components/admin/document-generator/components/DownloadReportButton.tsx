
import React from "react";
import { Button } from "@/components/ui/button";
import { FileBarChart } from "lucide-react";
import { Lead } from "@/types/leads";
import { useReportDownload } from "../hooks/useReportDownload";

interface DownloadReportButtonProps {
  lead: Lead;
  disabled?: boolean;
}

export const DownloadReportButton = ({ lead, disabled }: DownloadReportButtonProps) => {
  const { isLoading, handleDownloadReport } = useReportDownload();
  
  const onClick = () => handleDownloadReport(lead);
  
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant="outline"
      size="sm"
      className="whitespace-nowrap"
    >
      <FileBarChart className="h-4 w-4 mr-1" />
      <span>{isLoading ? "Downloading..." : "Report"}</span>
    </Button>
  );
};
