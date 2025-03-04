
import { Lead } from "@/types/leads";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LargeReportButtonProps {
  hasDownloaded: boolean;
  onClick: () => void;
}

export const LargeReportButton = ({ 
  hasDownloaded, 
  onClick 
}: LargeReportButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-3"
      variant={hasDownloaded ? "secondary" : "default"}
    >
      <Download className="h-5 w-5" />
      {hasDownloaded ? "Download Report" : "Download Report"}
    </Button>
  );
};
