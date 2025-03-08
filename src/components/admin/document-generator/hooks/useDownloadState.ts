
import { useState, useEffect } from "react";

interface UseDownloadStateProps {
  id: string;
  storageKey?: string;
}

export const useDownloadState = ({ 
  id,
  storageKey = 'downloaded_items'
}: UseDownloadStateProps) => {
  const [downloadedItems, setDownloadedItems] = useState<Set<string>>(new Set());
  
  // Load downloaded status from localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem(storageKey);
    
    if (savedItems) {
      setDownloadedItems(new Set(JSON.parse(savedItems)));
    }
  }, [storageKey]);
  
  // Save downloaded status to localStorage
  const saveDownloadStatus = (items: Set<string>) => {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(items)));
  };
  
  const markAsDownloaded = () => {
    const newItems = new Set(downloadedItems);
    newItems.add(id);
    setDownloadedItems(newItems);
    saveDownloadStatus(newItems);
  };
  
  return {
    hasDownloaded: downloadedItems.has(id),
    markAsDownloaded,
    downloadedItems
  };
};
