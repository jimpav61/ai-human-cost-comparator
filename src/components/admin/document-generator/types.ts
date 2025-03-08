
import { Lead } from "@/types/leads";

export interface DocumentGeneratorProps {
  lead: Lead;
}

export interface UseDownloadStateProps {
  id: string;
  leadId?: string; // Added to support existing code that uses leadId
  storageKey?: string;
}

export interface UseDownloadStateReturn {
  hasDownloaded: boolean;
  markAsDownloaded: () => void;
  downloadedItems: Set<string>;
}
