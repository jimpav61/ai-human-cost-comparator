
import { Lead } from "@/types/leads";
import { useReportDownload } from "../hooks/useReportDownload";
import { toast } from "@/hooks/use-toast";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      
      // Ensure the lead exists in the database before proceeding
      if (!lead.id) {
        toast({
          title: "Error", 
          description: "Lead ID is missing or invalid",
          variant: "destructive"
        });
        return;
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
      <Button
        disabled={isLoading}
        onClick={handleGenerateReport}
        className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50 min-w-[200px]"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        {isLoading ? "Generating..." : "Generate ROI Report"}
      </Button>
    </div>
  );
};
