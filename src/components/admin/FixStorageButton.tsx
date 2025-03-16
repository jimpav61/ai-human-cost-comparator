
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { fixReportStorageIssues } from "@/utils/report/storageUtils";
import { Wrench } from "lucide-react";

export const FixStorageButton = () => {
  const [isFixing, setIsFixing] = useState(false);

  const handleFixStorage = async () => {
    setIsFixing(true);
    
    try {
      toast({
        title: "Checking Storage",
        description: "Verifying storage access and permissions...",
        variant: "default",
      });
      
      const result = await fixReportStorageIssues();
      
      console.log("Storage fix attempt result:", result);
      
      if (result.success) {
        toast({
          title: "Storage Check Passed",
          description: result.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Storage Issue Detected",
          description: result.message,
          variant: "warning",
        });
        
        // If the issue is with permissions, show a more specific message
        if (result.details?.filesError || result.details?.uploadError) {
          toast({
            title: "Permission Issue",
            description: "You may not have permission to access or modify the reports bucket.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error fixing storage:", error);
      toast({
        title: "Operation Failed",
        description: "An unexpected error occurred while checking storage access.",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleFixStorage}
      disabled={isFixing}
      className="bg-green-50 border-green-500 text-green-700 hover:bg-green-100 font-medium"
    >
      <Wrench className="h-4 w-4 mr-1" />
      {isFixing ? "Checking Storage..." : "Verify Storage Access"}
    </Button>
  );
};
