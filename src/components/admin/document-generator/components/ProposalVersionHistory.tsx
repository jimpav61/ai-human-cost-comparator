import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/leads";
import { useProposalRevisions, ProposalRevision } from '../hooks/useProposalRevisions';
import { Loader2, FileDown, Clock, Calendar } from "lucide-react";
import { saveAs } from 'file-saver';
import { toast } from "@/hooks/use-toast";
import { getSafeFileName, getSafeFileNameWithOptions } from "@/utils/report/validation";

interface ProposalVersionHistoryProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const ProposalVersionHistory = ({ lead, isOpen, onClose }: ProposalVersionHistoryProps) => {
  const [revisions, setRevisions] = useState<ProposalRevision[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  
  const { 
    getProposalRevisions, 
    generatePdfFromRevision, 
    isLoading 
  } = useProposalRevisions();
  
  useEffect(() => {
    if (isOpen && lead?.id) {
      loadRevisions();
    }
  }, [isOpen, lead?.id]);
  
  const loadRevisions = async () => {
    if (!lead?.id) return;
    try {
      const fetchedRevisions = await getProposalRevisions(lead.id);
      console.log("Fetched revisions:", fetchedRevisions);
      setRevisions(fetchedRevisions);
    } catch (error) {
      console.error("Failed to load revisions:", error);
      toast({
        title: "Error",
        description: "Failed to load proposal versions. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDownloadRevision = async (revision: ProposalRevision) => {
    try {
      setGeneratingPdf(revision.id);
      console.log("Starting download of revision:", revision.id);
      
      const pdfContent = await generatePdfFromRevision(revision);
      
      if (!pdfContent) {
        throw new Error("Failed to generate PDF content");
      }
      
      console.log("PDF content received, length:", pdfContent.length);
      console.log("PDF content starts with:", typeof pdfContent === 'string' ? pdfContent.substring(0, 20) : 'Not a string');
      
      let pdfBlob;
      if (typeof pdfContent === 'string') {
        if (pdfContent.startsWith('data:application/pdf;base64,')) {
          console.log("Converting base64 to blob");
          const base64Data = pdfContent.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          
          for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
          }
          
          pdfBlob = new Blob(byteArrays, { type: 'application/pdf' });
        } else {
          console.log("Treating as base64 PDF content");
          try {
            const byteCharacters = atob(pdfContent);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
              const slice = byteCharacters.slice(offset, offset + 1024);
              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
              byteArrays.push(new Uint8Array(byteNumbers));
            }
            
            pdfBlob = new Blob(byteArrays, { type: 'application/pdf' });
          } catch (e) {
            console.error("Error decoding base64:", e);
            pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
          }
        }
      } else {
        throw new Error('Invalid PDF content type');
      }
      
      const safeCompanyName = getSafeFileName(lead);
      const filename = `${safeCompanyName}_v${revision.version_number}.pdf`;
      
      console.log("Saving PDF as:", filename);
      
      saveAs(pdfBlob, filename);
      
      toast({
        title: "Success",
        description: `Downloaded proposal version ${revision.version_number}`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error downloading revision:', error);
      toast({
        title: "Error",
        description: `Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setGeneratingPdf(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Proposal Version History</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="ml-2 text-gray-600">Loading versions...</p>
            </div>
          ) : revisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Clock className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-600">No proposal versions found</p>
              <p className="text-sm text-gray-500 mt-1">
                Use the "Generate Proposal Version" button in the Edit dialog to create versions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((revision) => (
                <Card key={revision.id} className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">v{revision.version_number}</Badge>
                        <h3 className="text-lg font-semibold">{revision.title}</h3>
                      </div>
                      {revision.is_sent && (
                        <Badge className="bg-green-500">Sent</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Calendar className="h-4 w-4 mr-1" /> 
                      {formatDate(revision.created_at)}
                    </div>
                    {revision.notes && (
                      <p className="text-sm text-gray-700">{revision.notes}</p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadRevision(revision)}
                      disabled={generatingPdf === revision.id}
                    >
                      {generatingPdf === revision.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={loadRevisions} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
