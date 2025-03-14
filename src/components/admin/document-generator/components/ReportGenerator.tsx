import { Lead } from "@/types/leads";
import { useReportDownload } from "@/hooks/useReportDownload";
import { toast } from "@/hooks/use-toast";
import { FileSpreadsheet } from "lucide-react";
import { DownloadButton } from "@/components/ui/download-button";
import { testStorageBucketConnectivity } from "@/utils/report/storageUtils";

interface ReportGeneratorProps {
  lead: Lead;
}

export const ReportGenerator = ({ lead }: ReportGeneratorProps) => {
  const { isLoading, handleDownloadReport } = useReportDownload();

  const handleGenerateReport = async () => {
    try {
      console.log("Starting report generation and download for lead:", lead.id);
      
      // First run a diagnostic check on the storage bucket
      const diagnosticResult = await testStorageBucketConnectivity();
      console.log("Storage diagnostic result:", diagnosticResult);
      
      if (!diagnosticResult.success) {
        console.error("Storage diagnostic check failed before attempting report download", diagnosticResult.error);
        if (!diagnosticResult.bucketExists) {
          toast({
            title: "Storage Warning",
            description: "Reports storage bucket not found. Report will be downloaded only.",
            variant: "destructive"
          });
        } else if (!diagnosticResult.authStatus) {
          toast({
            title: "Authentication Required",
            description: "You need to be logged in to save reports to storage.",
            variant: "default"
          });
        }
      } else {
        console.log("Storage diagnostic check passed, proceeding with report download");
      }
      
      // Proceed with report download
      await handleDownloadReport(lead);
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <DownloadButton
        hasDownloaded={false}
        label="Generate ROI Report"
        downloadedLabel="Download ROI Report"
        icon={<FileSpreadsheet className="h-4 w-4 mr-2" />}
        onClick={handleGenerateReport}
        className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50 min-w-[200px]"
        // Remove the loading prop as it doesn't exist on DownloadButtonProps
      />
    </div>
  );
};
