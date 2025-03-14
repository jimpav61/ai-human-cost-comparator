
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { findOrGenerateReport } from "./report-download/reportFinding";
import { testStorageBucketConnectivity } from "@/utils/report/storageUtils";

export const useReportDownload = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async (lead: Lead) => {
    try {
      setIsLoading(true);
      
      console.log("---------- TRACKING LEAD REPORT STORAGE PROCESS ----------");
      console.log("Lead ID:", lead.id);
      console.log("Company name:", lead.company_name);
      
      // Run a storage diagnostic check before attempting to find/generate the report
      const diagnosticResult = await testStorageBucketConnectivity();
      console.log("Storage diagnostic before report generation:", diagnosticResult);
      
      // Proceed with existing report finding/generation
      await findOrGenerateReport(lead, setIsLoading);
      
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to download report.",
        variant: "destructive",
      });
      setIsLoading(false);
    } finally {
      console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ENDED ----------");
    }
  };
  
  return {
    isLoading,
    handleDownloadReport
  };
};
