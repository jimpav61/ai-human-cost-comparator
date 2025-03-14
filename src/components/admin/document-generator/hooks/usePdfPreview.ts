
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
        contentStart: content.substring(0, 50) + '...' 
      });
      
      // Revoke previous URL if it exists
      if (currentPdfPreviewUrl) {
        URL.revokeObjectURL(currentPdfPreviewUrl);
      }
      
      let pdfBlob: Blob;
      
      // Check what format the content is in
      if (content.startsWith('JVB')) {
        console.log("Content appears to be in PDF base64 format");
        // It's already a PDF, start from the beginning
        try {
          const binaryData = atob(content);
          const bytes = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
          }
          pdfBlob = new Blob([bytes], { type: 'application/pdf' });
          console.log("Successfully converted base64 to PDF blob");
        } catch (e) {
          console.error("Error converting base64 to PDF:", e);
          throw new Error("Invalid PDF format from base64");
        }
      } else if (content.startsWith('data:application/pdf;base64,')) {
        console.log("Content appears to be in data URL format");
        // It has a data URL prefix
        try {
          const pdfData = content.split(',')[1];
          const binaryData = atob(pdfData);
          const bytes = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
          }
          pdfBlob = new Blob([bytes], { type: 'application/pdf' });
          console.log("Successfully converted data URL to PDF blob");
        } catch (e) {
          console.error("Error converting data URL to PDF:", e);
          throw new Error("Invalid PDF format from data URL");
        }
      } else {
        console.log("Content appears to be raw PDF or other format, trying as-is");
        // It's probably raw PDF content
        pdfBlob = new Blob([content], { type: 'application/pdf' });
      }
      
      // Create object URL for embedded viewer
      const url = URL.createObjectURL(pdfBlob);
      console.log("Created object URL for PDF preview:", url);
      setCurrentPdfPreviewUrl(url);
      
      return url;
    } catch (error) {
      console.error("Error previewing PDF:", error);
      toast({
        title: "Error",
        description: "Could not preview PDF. The content may not be in valid format.",
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
