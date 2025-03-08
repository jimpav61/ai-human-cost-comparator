
import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { Button } from "@/components/ui/button";
import { FileBarChart } from "lucide-react";
import { generateAndDownloadReport } from "@/utils/reportGenerator";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async () => {
    try {
      setIsLoading(true);
      await generateAndDownloadReport(lead);
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      onClick={handleDownloadReport}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center"
    >
      <FileBarChart className="h-4 w-4 mr-2" />
      {isLoading ? "Downloading..." : "Download Report"}
    </Button>
  );
};
