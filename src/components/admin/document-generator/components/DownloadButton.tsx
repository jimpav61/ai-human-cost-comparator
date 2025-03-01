
import { Button } from "@/components/ui/button";
import { DownloadButtonProps } from "../types";

export const DownloadButton = ({ 
  hasDownloaded, 
  label, 
  downloadedLabel, 
  icon, 
  onClick 
}: DownloadButtonProps) => {
  return (
    <Button
      variant={hasDownloaded ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={`flex items-center ${hasDownloaded ? 'bg-green-600 hover:bg-green-700' : ''}`}
    >
      {icon}
      {hasDownloaded ? downloadedLabel : label}
    </Button>
  );
};
