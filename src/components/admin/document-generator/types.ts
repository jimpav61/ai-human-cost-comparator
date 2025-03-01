
import { Lead } from "@/types/leads";

export interface DocumentGeneratorProps {
  lead: Lead;
}

export interface DownloadButtonProps {
  hasDownloaded: boolean;
  label: string;
  downloadedLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface UseDownloadStateProps {
  storageKey: string;
  leadId: string;
}

export interface UseDownloadStateReturn {
  hasDownloaded: boolean;
  markAsDownloaded: () => void;
  downloadedItems: Set<string>;
}
