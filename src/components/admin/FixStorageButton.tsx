
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
      const result = await fixReportStorageIssues();
      
      console.log("Storage fix attempt result:", result);
      
      if (result.success) {
        toast({
          title: "Storage Issues Fixed",
          description: result.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Fix Attempt Failed",
          description: result.message,
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Error fixing storage:", error);
      toast({
        title: "Operation Failed",
        description: "An unexpected error occurred while fixing storage issues.",
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
      className="bg-green-50 border-green-500 text-green-700 hover:bg-green-100"
    >
      <Wrench className="h-4 w-4 mr-1" />
      {isFixing ? "Fixing..." : "Fix Storage Issues"}
    </Button>
  );
};
