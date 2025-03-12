
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export const usePdfPreview = () => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [currentPdfPreviewUrl, setCurrentPdfPreviewUrl] = useState<string | null>(null);

  const handlePreviewPDF = (content: string) => {
    try {
      // Generate a PDF preview from the current content
      const base64pdf = content;
      
      // Revoke previous URL if it exists
      if (currentPdfPreviewUrl) {
        URL.revokeObjectURL(currentPdfPreviewUrl);
      }
      
      let pdfBlob: Blob;
      
      // Check what format the content is in
      if (base64pdf.startsWith('JVB')) {
        // It's already a PDF, start from the beginning
        const binaryData = atob(base64pdf);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        pdfBlob = new Blob([bytes], { type: 'application/pdf' });
      } else if (base64pdf.startsWith('data:application/pdf;base64,')) {
        // It has a data URL prefix
        const pdfData = base64pdf.split(',')[1];
        const binaryData = atob(pdfData);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        pdfBlob = new Blob([bytes], { type: 'application/pdf' });
      } else {
        // It's probably raw PDF content
        pdfBlob = new Blob([base64pdf], { type: 'application/pdf' });
      }
      
      // Create object URL for embedded viewer
      const url = URL.createObjectURL(pdfBlob);
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
