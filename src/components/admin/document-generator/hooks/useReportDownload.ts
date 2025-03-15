
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { findOrGenerateReport } from "./report-download/reportFinding";
import { testStorageBucketConnectivity } from "@/utils/report/storageUtils";
import { supabase } from "@/integrations/supabase/client";

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
      
      // If the bucket doesn't exist or there are storage issues, log detailed information
      if (!diagnosticResult.success) {
        console.error("STORAGE CRITICAL: Storage diagnostic failed", diagnosticResult);
        console.error("STORAGE CRITICAL: Auth status:", diagnosticResult.authStatus);
        console.error("STORAGE CRITICAL: Bucket exists:", diagnosticResult.bucketExists);
        console.error("STORAGE CRITICAL: Available buckets:", diagnosticResult.bucketList);
        
        // Attempt to create the bucket explicitly
        try {
          const { data, error } = await supabase.storage.createBucket('reports', {
            public: true,
            fileSizeLimit: 10485760, // 10MB limit
          });
          
          if (error) {
            console.error("STORAGE CRITICAL: Failed to create reports bucket:", error);
          } else {
            console.log("STORAGE CRITICAL: Successfully created reports bucket:", data);
          }
        } catch (createError) {
          console.error("STORAGE CRITICAL: Exception creating bucket:", createError);
        }
      }
      
      // Verify that the lead exists in the database
      const { data: existingLead, error: checkError } = await supabase
        .from('leads')
        .select('id')
        .eq('id', lead.id)
        .maybeSingle();
      
      if (checkError || !existingLead) {
        console.error("Lead doesn't exist in database:", checkError);
        toast({
          title: "Error",
          description: "Lead not found in database. Cannot generate report.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
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
