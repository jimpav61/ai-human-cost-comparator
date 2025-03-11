
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Lead } from "@/types/leads";
import { useProposalPreview } from "../hooks/useProposalPreview";
import { toast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PreviewProposalButtonProps {
  lead: Lead;
  disabled?: boolean;
}

export const PreviewProposalButton = ({ lead, disabled }: PreviewProposalButtonProps) => {
  const { 
    isLoading, 
    handlePreviewProposal, 
    editableProposal, 
    setEditableProposal,
    getProposalRevisions,
    saveProposalRevision
  } = useProposalPreview();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [proposalContent, setProposalContent] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");
  const [proposalVersions, setProposalVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  
  const onClick = async () => {
    console.log("Preview button clicked with lead:", lead);
    
    if (!lead.calculator_inputs || !lead.calculator_results) {
      console.error("Missing calculator data");
      toast({
        title: "Missing Data",
        description: "Calculator data is missing. Please edit the lead and configure calculator options first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Load previous versions
      setIsLoadingVersions(true);
      const versions = await getProposalRevisions(lead.id);
      setProposalVersions(versions);
      setIsLoadingVersions(false);
      
      // Generate a new preview
      await handlePreviewProposal(lead);
      
      // Only open dialog if we have editable content
      if (editableProposal && editableProposal.content) {
        setProposalContent(editableProposal.content);
        setProposalTitle(editableProposal.title);
        setProposalNotes(editableProposal.notes);
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error("Error in preview button click handler:", error);
      // Error is already handled in the hook with toast
    }
  };
  
  const loadProposalVersion = (version: any) => {
    setSelectedVersion(version);
    setProposalContent(version.proposal_content);
    setProposalTitle(version.title);
    setProposalNotes(version.notes || "");
  };
  
  const handleSaveChanges = async () => {
    try {
      // Save as a new revision
      await saveProposalRevision(
        lead.id,
        proposalContent,
        proposalTitle,
        proposalNotes
      );
      
      // Reload versions after saving
      const versions = await getProposalRevisions(lead.id);
      setProposalVersions(versions);
      
      // Close the dialog
      setIsDialogOpen(false);
      
      // Reset the state
      setEditableProposal(null);
      setSelectedVersion(null);
    } catch (error) {
      console.error("Error saving proposal changes:", error);
    }
  };
  
  const handlePreviewPDF = () => {
    try {
      // Generate a PDF preview from the current content
      const base64pdf = proposalContent;
      
      // Check if content is already base64
      if (base64pdf.startsWith('JVB')) {
        // It's already a PDF, start from the beginning
        const binaryData = atob(base64pdf);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
      } else if (base64pdf.startsWith('data:application/pdf;base64,')) {
        // It has a data URL prefix
        const pdfData = base64pdf.split(',')[1];
        const binaryData = atob(pdfData);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
      } else {
        // It's probably raw PDF content
        const pdfBlob = new Blob([base64pdf], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error("Error previewing PDF:", error);
      toast({
        title: "Error",
        description: "Could not preview PDF. The content may not be in valid format.",
        variant: "destructive",
      });
    }
  };
  
  const renderVersionList = () => {
    if (isLoadingVersions) {
      return <div className="p-4 text-center">Loading previous versions...</div>;
    }
    
    if (proposalVersions.length === 0) {
      return <div className="p-4 text-center">No previous versions found.</div>;
    }
    
    return (
      <div className="space-y-2 max-h-[300px] overflow-y-auto p-2">
        {proposalVersions.map((version) => (
          <div
            key={version.id}
            className={`p-3 border rounded cursor-pointer hover:bg-gray-100 ${
              selectedVersion?.id === version.id ? 'bg-gray-100 border-primary' : ''
            }`}
            onClick={() => loadProposalVersion(version)}
          >
            <div className="flex justify-between">
              <span className="font-medium">{version.title || `Version ${version.version_number}`}</span>
              <span className="text-sm text-gray-500">
                {new Date(version.created_at).toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-gray-600 truncate">
              {version.notes || "No notes"}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <>
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        variant="outline"
        size="sm"
        className="whitespace-nowrap"
      >
        <Eye className="h-4 w-4 mr-1" />
        <span>{isLoading ? "Loading..." : "Preview"}</span>
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposal Editor</DialogTitle>
            <DialogDescription>
              Edit your proposal content and metadata before finalizing it.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="edit">Edit Metadata</TabsTrigger>
              <TabsTrigger value="content">Edit Content</TabsTrigger>
              <TabsTrigger value="versions">Previous Versions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Proposal Title</Label>
                  <Input
                    id="title"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    placeholder="Enter proposal title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={proposalNotes}
                    onChange={(e) => setProposalNotes(e.target.value)}
                    placeholder="Add notes or comments about this proposal"
                    rows={4}
                  />
                </div>
                
                <div className="pt-4">
                  <Button onClick={handlePreviewPDF} variant="outline" className="mr-2">
                    Preview PDF
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Raw Proposal Content</Label>
                <div className="relative">
                  <Textarea
                    id="content"
                    value={proposalContent}
                    onChange={(e) => setProposalContent(e.target.value)}
                    placeholder="Proposal content (PDF in base64 format or raw content)"
                    rows={12}
                    className="font-mono text-xs"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Warning: This is the raw content of the proposal. Editing this directly may break the PDF preview.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="versions" className="space-y-4">
              <div className="space-y-2">
                <Label>Previous Versions</Label>
                {renderVersionList()}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <div>
              <Button onClick={handlePreviewPDF} variant="outline" className="mr-2">
                Preview PDF
              </Button>
              <Button onClick={handleSaveChanges} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save as New Version"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
