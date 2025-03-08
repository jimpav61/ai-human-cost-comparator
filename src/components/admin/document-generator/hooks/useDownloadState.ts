
import { useState, useEffect } from "react";
import { UseDownloadStateProps, UseDownloadStateReturn } from "../types";

export const useDownloadState = ({ 
  id,
  leadId, // Add support for leadId parameter
  storageKey = 'downloaded_items'
}: UseDownloadStateProps): UseDownloadStateReturn => {
  // Use leadId as fallback if provided (for backward compatibility)
  const itemId = id || leadId || '';
  
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
    newItems.add(itemId);
    setDownloadedItems(newItems);
    saveDownloadStatus(newItems);
  };
  
  return {
    hasDownloaded: downloadedItems.has(itemId),
    markAsDownloaded,
    downloadedItems
  };
};
