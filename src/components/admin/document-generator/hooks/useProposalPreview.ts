
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { generateProposalPdf } from "../utils/proposalPdfGenerator";
import { useProposalRevisions } from "./useProposalRevisions";
import { usePdfPreview } from "./usePdfPreview";
import { useEditableProposal } from "./useEditableProposal";

export const useProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    isLoading: isLoadingRevisions,
    currentRevision,
    setCurrentRevision,
    getProposalRevisions,
    saveProposalRevision,
    getLatestProposalRevision,
    updateProposalRevision
  } = useProposalRevisions();
  
  const {
    showPdfPreview,
    setShowPdfPreview,
    currentPdfPreviewUrl,
    handlePreviewPDF,
    downloadPdf,
    cleanupPdfPreview
  } = usePdfPreview();
  
  const {
    editableProposal,
    setEditableProposal,
    proposalVersions,
    setProposalVersions,
    selectedVersion,
    setSelectedVersion,
    isLoadingVersions,
    setIsLoadingVersions,
    editingAiTier,
    editingAiType,
    editingCallVolume,
    setEditingCallVolume,
    proposalTitle,
    setProposalTitle,
    proposalNotes,
    setProposalNotes,
    initializeFromLead,
    loadProposalVersion,
    calculatePrice,
    handleTierChange,
    handleAITypeChange,
    getUnifiedDocumentData
  } = useEditableProposal();
  
  // Generate the proposal and save as revision
  const handlePreviewProposal = async (lead: Lead) => {
    try {
      console.log("Previewing proposal for lead:", lead.id);
      console.log("Current lead calculator_inputs:", JSON.stringify(lead.calculator_inputs, null, 2));
      console.log("Current lead calculator_results:", JSON.stringify(lead.calculator_results, null, 2));
      setIsLoading(true);
      
      // Initialize form state from lead data
      initializeFromLead(lead);
      
      // First, check if we already have a proposal for this lead
      const existingProposal = await getLatestProposalRevision(lead.id);
      
      if (existingProposal) {
        console.log("Found existing proposal, using it:", existingProposal.id);
        setEditableProposal({
          id: lead.id,
          content: existingProposal.proposal_content,
          version: existingProposal.version_number,
          title: existingProposal.title,
          notes: existingProposal.notes || ""
        });
        setProposalTitle(existingProposal.title);
        setProposalNotes(existingProposal.notes || "");
        
        // Create PDF preview
        handlePreviewPDF(existingProposal.proposal_content);
        
        setShowPdfPreview(true);
        setIsLoading(false);
        return existingProposal;
      }
      
      // Make sure we have valid calculator inputs to use
      if (!lead.calculator_inputs || !lead.calculator_results) {
        throw new Error("Lead is missing required calculator data");
      }
      
      // Generate a professional proposal using existing data (no recalculation)
      const proposalContent = generateProposalPdf(lead);
      
      // Save the proposal content to the database for future editing
      const title = `Proposal for ${lead.company_name}`;
      const notes = "Generated preview";
      
      const newRevision = await saveProposalRevision(lead.id, proposalContent, title, notes);
      
      // Set the editable proposal for the editor
      setEditableProposal({
        id: lead.id,
        content: proposalContent,
        version: newRevision.version_number,
        title,
        notes
      });
      setProposalTitle(title);
      setProposalNotes(notes);
      
      // Create PDF preview
      handlePreviewPDF(proposalContent);
      
      // Show success message
      toast({
        title: "Proposal Generated",
        description: "Your proposal has been generated successfully and can now be edited.",
        variant: "default",
      });
      
      setShowPdfPreview(true);
      setIsLoading(false);
      return newRevision;
      
    } catch (error) {
      console.error("Error previewing proposal:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: `Failed to preview proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Handle creating a new version of the proposal with updated settings
  const handleCreateNewVersion = async (lead: Lead) => {
    try {
      // Use the unified document approach to create an updated lead with consistent data
      const updatedLead = getUnifiedDocumentData(lead);
      
      // Generate the new proposal content from the updated lead
      const updatedProposalContent = generateProposalPdf(updatedLead);
      
      // Store the pricing information in the notes as JSON
      const pricing = calculatePrice();
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
        updatedProposalContent,
        proposalTitle,
        notesWithMetadata
      );
      
      // Reload versions after saving
      const versions = await getProposalRevisions(lead.id);
      setProposalVersions(versions);
      
      // Update the content and preview
      setEditableProposal({
        id: lead.id,
        content: updatedProposalContent,
        version: newRevision.version_number,
        title: proposalTitle,
        notes: notesWithMetadata
      });
      
      handlePreviewPDF(updatedProposalContent);
      
      // Load the new version
      setSelectedVersion(newRevision);
      
      toast({
        title: "Success",
        description: `Created proposal version ${newRevision.version_number}`,
        variant: "default",
      });
      
      return newRevision;
    } catch (error) {
      console.error("Error saving proposal changes:", error);
      toast({
        title: "Error", 
        description: "Failed to create new version",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Load all versions for a lead
  const loadProposalVersions = async (leadId: string) => {
    setIsLoadingVersions(true);
    const versions = await getProposalRevisions(leadId);
    setProposalVersions(versions);
    setIsLoadingVersions(false);
    return versions;
  };
  
  return {
    isLoading: isLoading || isLoadingRevisions,
    editableProposal,
    setEditableProposal,
    currentRevision,
    setCurrentRevision,
    showPdfPreview,
    setShowPdfPreview,
    currentPdfPreviewUrl,
    proposalVersions,
    setProposalVersions,
    selectedVersion,
    setSelectedVersion,
    isLoadingVersions,
    editingAiTier,
    editingAiType,
    editingCallVolume,
    setEditingCallVolume,
    proposalTitle,
    setProposalTitle,
    proposalNotes,
    setProposalNotes,
    
    // Functions
    getProposalRevisions,
    getLatestProposalRevision,
    saveProposalRevision,
    updateProposalRevision,
    handlePreviewProposal,
    handlePreviewPDF,
    downloadPdf,
    cleanupPdfPreview,
    loadProposalVersion,
    handleCreateNewVersion,
    loadProposalVersions,
    calculatePrice,
    handleTierChange,
    handleAITypeChange,
    generateProfessionalProposal: generateProposalPdf
  };
};
