
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
    loadProposalVersions,
    handleCreateNewVersion,
    editableProposal,
    proposalVersions,
    selectedVersion,
    isLoadingVersions,
    currentPdfPreviewUrl,
    showPdfPreview,
    setShowPdfPreview,
    editingAiTier,
    editingAiType,
    editingCallVolume,
    setEditingCallVolume,
    proposalTitle,
    setProposalTitle,
    proposalNotes,
    setProposalNotes,
    handleTierChange,
    handleAITypeChange,
    loadProposalVersion,
    calculatePrice,
    handlePreviewPDF,
    downloadPdf,
    cleanupPdfPreview
  } = useProposalPreview();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  
  // Clean up PDF preview URL when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      cleanupPdfPreview();
    }
  }, [isDialogOpen, cleanupPdfPreview]);
  
  const pricing = calculatePrice();
  
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
      await loadProposalVersions(lead.id);
      
      // Get or generate a preview
      const latestRevision = await handlePreviewProposal(lead);
      
      if (latestRevision) {
        setIsDialogOpen(true);
        setActiveTab("preview"); // Start with preview tab
      }
    } catch (error) {
      console.error("Error in preview button click handler:", error);
      // Error is already handled in the hook with toast
    }
  };
  
  const handleSaveNewVersion = async () => {
    try {
      await handleCreateNewVersion(lead);
    } catch (error) {
      // Error already handled in the hook
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
                          onValueChange={(value) => handleTierChange(value as "starter" | "growth" | "premium")}
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
                    </div>
                  </Card>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab("preview")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Preview
                  </Button>
                  <Button onClick={handleSaveNewVersion}>
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
