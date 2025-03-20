
import { Lead } from "@/types/leads";
import { useReportDownload } from "../hooks/useReportDownload";
import { toast } from "@/hooks/use-toast";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { testStorageBucketConnectivity } from "@/utils/report/bucketUtils";
import { useState } from "react";

interface ReportGeneratorProps {
  lead: Lead;
}

export const ReportGenerator = ({ lead }: ReportGeneratorProps) => {
  const { isLoading, handleDownloadReport } = useReportDownload();
  const [diagnosticInfo, setDiagnosticInfo] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    try {
      console.log("Starting report generation and download for lead:", lead.id);
      console.log("Lead company:", lead.company_name);
      
      // First run a diagnostic check on the storage bucket
      const diagnosticResult = await testStorageBucketConnectivity();
      const diagInfo = JSON.stringify(diagnosticResult, null, 2);
      setDiagnosticInfo(diagInfo);
      console.log("Storage diagnostic result:", diagInfo);
      
      if (!diagnosticResult.success) {
        console.error("Storage diagnostic check failed before attempting report download", diagnosticResult.error);
        
        // Provide more specific error messaging based on diagnostic results
        if (!diagnosticResult.bucketAccessible) {
          toast({
            title: "Storage Warning",
            description: "Reports storage bucket not found. Report will be downloaded only.",
            variant: "destructive"
          });
        } else if (diagnosticResult.authStatus === false) {
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
      
      // Proceed with report download using the improved functions
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
      
      {diagnosticInfo && (
        <div className="mt-2 text-xs text-gray-500 hidden">
          <p>Diagnostic info: {diagnosticInfo}</p>
        </div>
      )}
    </div>
  );
};
