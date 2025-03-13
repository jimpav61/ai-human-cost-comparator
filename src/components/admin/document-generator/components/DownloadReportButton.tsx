
import React from "react";
import { Button } from "@/components/ui/button";
import { FileBarChart, Loader2 } from "lucide-react";
import { Lead } from "@/types/leads";
import { useReportDownload } from "../hooks/useReportDownload";

interface DownloadReportButtonProps {
  lead: Lead;
  disabled?: boolean;
}

export const DownloadReportButton = ({ lead, disabled }: DownloadReportButtonProps) => {
  const { isLoading, handleDownloadReport } = useReportDownload();
  
  const onClick = () => {
    console.log("Download report button clicked for lead:", lead.id);
    handleDownloadReport(lead);
  };
  
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant="outline"
      size="sm"
      className="whitespace-nowrap"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          <FileBarChart className="h-4 w-4 mr-1" />
          <span>Report</span>
        </>
      )}
    </Button>
  );
};
