
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, FileEdit, Save, FileText, ArrowLeft, Download } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";

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
    getLatestProposalRevision,
    saveProposalRevision,
    currentRevision,
    setCurrentRevision,
    showPdfPreview,
    setShowPdfPreview
  } = useProposalPreview();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [proposalContent, setProposalContent] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");
  const [proposalVersions, setProposalVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [currentPdfPreviewUrl, setCurrentPdfPreviewUrl] = useState<string | null>(null);
  
  // Form state for proposal editing
  const [editingAiTier, setEditingAiTier] = useState(lead.calculator_inputs?.aiTier || 'growth');
  const [editingAiType, setEditingAiType] = useState(lead.calculator_inputs?.aiType || 'both');
  const [editingCallVolume, setEditingCallVolume] = useState(
    typeof lead.calculator_inputs?.callVolume === 'number' 
      ? lead.calculator_inputs.callVolume 
      : 0
  );
  
  // Calculate pricing based on current selections
  const calculatePrice = () => {
    const basePrice = 
      editingAiTier === 'starter' ? 99 :
      editingAiTier === 'growth' ? 229 :
      editingAiTier === 'premium' ? 429 : 229;
    
    const includedMinutes = editingAiTier === 'starter' ? 0 : 600;
    const extraVoiceCost = editingAiTier !== 'starter' ? editingCallVolume * 0.12 : 0;
    
    return {
      basePrice,
      includedMinutes,
      extraVoiceCost,
      totalPrice: basePrice + extraVoiceCost
    };
  };
  
  const pricing = calculatePrice();
  
  // Reset form state when lead changes
  useEffect(() => {
    if (lead) {
      setEditingAiTier(lead.calculator_inputs?.aiTier || 'growth');
      setEditingAiType(lead.calculator_inputs?.aiType || 'both');
      setEditingCallVolume(
        typeof lead.calculator_inputs?.callVolume === 'number' 
          ? lead.calculator_inputs.callVolume 
          : 0
      );
    }
  }, [lead]);
  
  // Effect to update form when changing versions
  useEffect(() => {
    if (selectedVersion) {
      // If we have version-specific pricing data in notes (could be stored as JSON)
      try {
        const notesData = JSON.parse(selectedVersion.notes || "{}");
        if (notesData.aiTier) setEditingAiTier(notesData.aiTier);
        if (notesData.aiType) setEditingAiType(notesData.aiType);
        if (notesData.callVolume !== undefined) setEditingCallVolume(notesData.callVolume);
      } catch (e) {
        // If notes isn't JSON, just continue with lead data
      }
    }
  }, [selectedVersion]);
  
  // Clean up PDF preview URL when dialog closes
  useEffect(() => {
    if (!isDialogOpen && currentPdfPreviewUrl) {
      URL.revokeObjectURL(currentPdfPreviewUrl);
      setCurrentPdfPreviewUrl(null);
    }
  }, [isDialogOpen, currentPdfPreviewUrl]);
  
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
      
      // Get or generate a preview
      const latestRevision = await handlePreviewProposal(lead);
      
      if (latestRevision) {
        setProposalContent(latestRevision.proposal_content);
        setProposalTitle(latestRevision.title);
        setProposalNotes(latestRevision.notes || "");
        
        // Create PDF preview on initial open
        handlePreviewPDF(latestRevision.proposal_content);
        
        setIsDialogOpen(true);
        setActiveTab("preview"); // Start with preview tab
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
    
    // Also create PDF preview for this version
    handlePreviewPDF(version.proposal_content);
  };
  
  const handleCreateNewVersion = async () => {
    try {
      // Store the pricing information in the notes as JSON
      const metadataForNotes = {
        aiTier: editingAiTier,
        aiType: editingAiType,
        callVolume: editingCallVolume,
        basePrice: pricing.basePrice,
        totalPrice: pricing.totalPrice
      };
      
      const notesWithMetadata = JSON.stringify(metadataForNotes);
      
      // Save as a new revision
      const newRevision = await saveProposalRevision(
        lead.id,
        proposalContent,
        proposalTitle,
        notesWithMetadata
      );
      
      // Reload versions after saving
      const versions = await getProposalRevisions(lead.id);
      setProposalVersions(versions);
      
      // Load the new version
      setSelectedVersion(newRevision);
      
      toast({
        title: "Success",
        description: `Created proposal version ${newRevision.version_number}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving proposal changes:", error);
      toast({
        title: "Error", 
        description: "Failed to create new version",
        variant: "destructive",
      });
    }
  };
  
  const handlePreviewPDF = (content = proposalContent) => {
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
  
  // Handle changes to AI tier with proper AI type adjustment
  const handleTierChange = (newTier: string) => {
    setEditingAiTier(newTier);
    
    // Update AI type based on tier
    if (newTier === 'starter' && editingAiType !== 'chatbot') {
      setEditingAiType('chatbot');
      setEditingCallVolume(0);
    } else if (newTier === 'premium') {
      if (editingAiType === 'voice') setEditingAiType('conversationalVoice');
      else if (editingAiType === 'both') setEditingAiType('both-premium');
    } else if (newTier === 'growth') {
      if (editingAiType === 'conversationalVoice') setEditingAiType('voice');
      else if (editingAiType === 'both-premium') setEditingAiType('both');
    }
  };
  
  // Handle AI type change with proper tier adjustment
  const handleAITypeChange = (newType: string) => {
    setEditingAiType(newType);
    
    // Update tier based on AI type
    if ((newType === 'conversationalVoice' || newType === 'both-premium') && editingAiTier !== 'premium') {
      setEditingAiTier('premium');
    } else if ((newType === 'voice' || newType === 'both') && editingAiTier === 'starter') {
      setEditingAiTier('growth');
    } else if (newType === 'chatbot' && editingAiTier === 'starter') {
      setEditingCallVolume(0);
    }
  };
  
  const downloadPdf = () => {
    if (!currentPdfPreviewUrl) return;
    
    const a = document.createElement('a');
    a.href = currentPdfPreviewUrl;
    a.download = `Proposal_${lead.company_name || 'Client'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
              {(() => {
                try {
                  const notesData = JSON.parse(version.notes || "{}");
                  if (notesData.aiTier && notesData.totalPrice) {
                    return `${notesData.aiTier.charAt(0).toUpperCase() + notesData.aiTier.slice(1)} Plan: ${formatCurrency(notesData.totalPrice)}/month`;
                  }
                  return version.notes || "No notes";
                } catch (e) {
                  return version.notes || "No notes";
                }
              })()}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Create preset volume options in increments of 50
  const volumeOptions = Array.from({ length: 21 }, (_, i) => i * 50);
  
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Proposal Preview</DialogTitle>
            <DialogDescription>
              View, edit, and manage proposal versions for {lead.company_name || 'this lead'}.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="edit">Edit Proposal</TabsTrigger>
              <TabsTrigger value="versions">Version History</TabsTrigger>
            </TabsList>
            
            <div className="flex-grow overflow-auto">
              <TabsContent value="preview" className="h-full">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between mb-4">
                    <Button variant="outline" onClick={downloadPdf} disabled={!currentPdfPreviewUrl}>
                      <Download className="h-4 w-4 mr-2" /> Download PDF
                    </Button>
                    <Button variant="default" onClick={() => setActiveTab("edit")}>
                      <FileEdit className="h-4 w-4 mr-2" /> Edit Proposal
                    </Button>
                  </div>
                  
                  {currentPdfPreviewUrl ? (
                    <div className="h-[500px] border rounded">
                      <iframe 
                        src={currentPdfPreviewUrl} 
                        className="w-full h-full" 
                        title="PDF Preview"
                      />
                    </div>
                  ) : (
                    <div className="h-[500px] flex items-center justify-center border rounded">
                      <p>No PDF preview available</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="edit" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h3 className="text-lg font-medium mb-3">Plan Options</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="aiTier">AI Plan Tier</Label>
                        <Select
                          value={editingAiTier}
                          onValueChange={handleTierChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select tier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starter">Starter Plan (Text Only)</SelectItem>
                            <SelectItem value="growth">Growth Plan (Text & Basic Voice)</SelectItem>
                            <SelectItem value="premium">Premium Plan (Text & Conversational Voice)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="aiType">AI Type</Label>
                        <Select
                          value={editingAiType}
                          onValueChange={handleAITypeChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select AI type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chatbot">Text Only</SelectItem>
                            <SelectItem value="voice" disabled={editingAiTier === 'starter'}>Basic Voice Only</SelectItem>
                            <SelectItem value="conversationalVoice" disabled={editingAiTier !== 'premium'}>Conversational Voice Only</SelectItem>
                            <SelectItem value="both" disabled={editingAiTier === 'starter'}>Text & Basic Voice</SelectItem>
                            <SelectItem value="both-premium" disabled={editingAiTier !== 'premium'}>Text & Conversational Voice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="callVolume">Additional Voice Minutes</Label>
                        <Select
                          value={editingCallVolume.toString()}
                          onValueChange={(value) => setEditingCallVolume(parseInt(value, 10))}
                          disabled={editingAiTier === 'starter'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select minutes" />
                          </SelectTrigger>
                          <SelectContent>
                            {volumeOptions.map((option) => (
                              <SelectItem key={option} value={option.toString()}>
                                {option} minutes
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {editingAiTier !== 'starter' && (
                          <p className="text-xs text-green-600">
                            {pricing.includedMinutes} minutes included free
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 p-3 bg-gray-50 rounded border">
                      <div className="text-sm">
                        <div className="flex justify-between py-1">
                          <span>Base Plan Price:</span>
                          <span className="font-medium">{formatCurrency(pricing.basePrice)}/month</span>
                        </div>
                        
                        {editingAiTier !== 'starter' && (
                          <div className="flex justify-between py-1">
                            <span>Additional Voice Cost:</span>
                            <span className="font-medium">{formatCurrency(pricing.extraVoiceCost)}/month</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between pt-2 border-t mt-2 font-medium">
                          <span>Total Monthly Cost:</span>
                          <span className="text-green-700">{formatCurrency(pricing.totalPrice)}/month</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="text-lg font-medium mb-3">Proposal Details</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Proposal Title</Label>
                        <Input
                          id="title"
                          value={proposalTitle}
                          onChange={(e) => setProposalTitle(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={proposalNotes}
                          onChange={(e) => setProposalNotes(e.target.value)}
                          rows={3}
                        />
                        <p className="text-xs text-gray-500">
                          These notes are for your reference and won't appear in the proposal.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="content">Raw Content (Advanced)</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mb-2"
                          onClick={() => {
                            const url = handlePreviewPDF();
                            if (url) setCurrentPdfPreviewUrl(url);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" /> Preview Changes
                        </Button>
                        <Textarea
                          id="content"
                          value={proposalContent}
                          onChange={(e) => setProposalContent(e.target.value)}
                          className="font-mono text-xs h-32"
                        />
                        <p className="text-xs text-gray-500">
                          Warning: Only edit raw content if you know what you're doing.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab("preview")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Preview
                  </Button>
                  <Button onClick={handleCreateNewVersion}>
                    <Save className="h-4 w-4 mr-2" /> Save as New Version
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="versions" className="h-full overflow-auto">
                <h3 className="text-lg font-medium mb-3">Version History</h3>
                {renderVersionList()}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};
