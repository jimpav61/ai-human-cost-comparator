
export interface DocumentGeneratorProps {
  lead: Lead;
}

export interface UseDownloadStateProps {
  id: string;
  storageKey?: string;
}

export interface UseDownloadStateReturn {
  hasDownloaded: boolean;
  markAsDownloaded: () => void;
  downloadedItems: Set<string>;
}
