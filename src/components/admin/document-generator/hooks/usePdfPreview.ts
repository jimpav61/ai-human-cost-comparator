
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export const usePdfPreview = () => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [currentPdfPreviewUrl, setCurrentPdfPreviewUrl] = useState<string | null>(null);

  const handlePreviewPDF = (content: string) => {
    try {
      console.log("Creating PDF preview from content", { 
        contentType: typeof content,
        contentLength: content.length,
        contentStart: content.substring(0, 100).replace(/\n/g, '\\n') + '...',
        isPdf: content.startsWith('%PDF-')
      });
      
      // Revoke previous URL if it exists
      if (currentPdfPreviewUrl) {
        URL.revokeObjectURL(currentPdfPreviewUrl);
      }
      
      let pdfBlob: Blob;
      
      // Check if content is a raw PDF document
      if (content.startsWith('%PDF-')) {
        console.log("Content is a raw PDF document");
        const encoder = new TextEncoder();
        const pdfData = encoder.encode(content);
        pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
      }
      // Check if the content is a JSON string with base64 PDF data
      else if (content.startsWith('{') && content.includes('"pdf":')) {
        console.log("Content appears to be JSON with PDF data");
        try {
          const jsonData = JSON.parse(content);
          if (jsonData.pdf) {
            const binaryString = atob(jsonData.pdf);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            pdfBlob = new Blob([bytes], { type: 'application/pdf' });
            console.log("Successfully extracted PDF from JSON");
          } else {
            throw new Error("JSON does not contain PDF data");
          }
        } catch (e) {
          console.error("Error processing JSON PDF data:", e);
          throw new Error("Failed to process JSON PDF data: " + e.message);
        }
      }
      // Check if the content is base64 encoded PDF (usually starts with "JVB")
      else if (/^[A-Za-z0-9+/=]+$/.test(content) && content.length > 100) {
        console.log("Content appears to be base64 encoded data");
        try {
          const binaryString = atob(content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          pdfBlob = new Blob([bytes], { type: 'application/pdf' });
          console.log("Successfully converted base64 to PDF blob");
        } catch (e) {
          console.error("Error decoding base64 content:", e);
          throw new Error("Failed to decode PDF content: " + e.message);
        }
      }
      // Check if it's a data URL
      else if (content.startsWith('data:application/pdf;base64,')) {
        console.log("Content is a data URL");
        try {
          const base64Data = content.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          pdfBlob = new Blob([bytes], { type: 'application/pdf' });
        } catch (e) {
          console.error("Error processing data URL:", e);
          throw new Error("Failed to process data URL: " + e.message);
        }
      }
      // Fall back to treating it as raw content
      else {
        console.log("Content format not recognized, treating as plain text");
        // Since we can't determine the format, try to read the content as plain text
        // This helps diagnose issues by showing what was actually returned
        pdfBlob = new Blob([content], { type: 'text/plain' });
      }
      
      // Create object URL for embedded viewer
      const url = URL.createObjectURL(pdfBlob);
      console.log("Created object URL for PDF preview:", url);
      setCurrentPdfPreviewUrl(url);
      setShowPdfPreview(true);
      
      return url;
    } catch (error) {
      console.error("Error previewing PDF:", error);
      toast({
        title: "Error",
        description: "Could not preview PDF. " + (error instanceof Error ? error.message : "Invalid content format."),
        variant: "destructive",
      });
      return null;
    }
  };

  const downloadPdf = () => {
    if (!currentPdfPreviewUrl) return;
    
    const a = document.createElement('a');
    a.href = currentPdfPreviewUrl;
    a.download = 'proposal.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Clean up resources when component unmounts
  const cleanupPdfPreview = () => {
    if (currentPdfPreviewUrl) {
      URL.revokeObjectURL(currentPdfPreviewUrl);
      setCurrentPdfPreviewUrl(null);
    }
  };

  return {
    showPdfPreview,
    setShowPdfPreview,
    currentPdfPreviewUrl,
    handlePreviewPDF,
    downloadPdf,
    cleanupPdfPreview
  };
};
