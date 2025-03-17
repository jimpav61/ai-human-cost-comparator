
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Lead } from "@/types/leads";
import { Button } from "@/components/ui/button";
import { verifyLeadReportStorage } from "@/utils/report/storageUtils";
import { fixReportStorageIssues } from "@/utils/report/storageUtils";
import { AlertTriangle, CheckCircle2, Database } from "lucide-react";

interface StorageVerificationButtonProps {
  lead: Lead;
}

export const StorageVerificationButton = ({ lead }: StorageVerificationButtonProps) => {
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStorage = async () => {
    if (!lead || !lead.id) {
      toast({
        title: "Invalid Lead Data",
        description: "Cannot verify storage for this lead.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    
    try {
      console.log("Checking storage for lead:", lead.id, lead.company_name);
      const result = await verifyLeadReportStorage(lead);
      
      console.log("Storage verification result:", result);
      
      if (result.error) {
        toast({
          title: "Storage Check Error",
          description: `Error: ${result.error.message || "Unknown error"}`,
          variant: "destructive",
        });
        
        // Suggest fixing storage if authentication or access errors
        if (result.error.message?.includes("not authenticated") || 
            result.error.message?.includes("access") ||
            result.error.message?.includes("permission")) {
          toast({
            title: "Storage Setup Required",
            description: "Click the 'Fix Storage Issues' button in the header to resolve this issue.",
            variant: "warning",
          });
        }
      } else if (result.exists) {
        toast({
          title: "Report Found",
          description: `Found ${result.matchingFiles?.length || 0} file(s) for ${result.companyName}`,
          variant: "default",
        });
      } else {
        toast({
          title: "No Report Found",
          description: `No report files found for ${result.companyName}. Try generating a report first.`,
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Error checking storage:", error);
      toast({
        title: "Verification Failed",
        description: "An unexpected error occurred while checking storage.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCheckStorage}
      disabled={isChecking}
    >
      <Database className="h-4 w-4 mr-1" />
      {isChecking ? "Checking..." : "Verify Storage"}
    </Button>
  );
};
