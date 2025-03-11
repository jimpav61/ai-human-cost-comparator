import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [editableProposal, setEditableProposal] = useState<string | null>(null);
  const [currentRevision, setCurrentRevision] = useState<any>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  
  // Preview the proposal for a lead
  const handlePreviewProposal = async (lead: Lead) => {
    try {
      console.log("Previewing proposal for lead:", lead.id);
      console.log("Current lead calculator_inputs:", lead.calculator_inputs);
      console.log("Current lead calculator_results:", lead.calculator_results);
      
      setIsLoading(true);
      
      // Find the latest proposal revision first
      const latestRevision = await getLatestProposalRevision(lead.id);
      
      if (latestRevision) {
        console.log("Found existing proposal, using it:", latestRevision.id);
        setCurrentRevision(latestRevision);
        setEditableProposal(latestRevision.proposal_content);
        return latestRevision;
      }
      
      // If no existing proposal, generate a new one
      console.log("No existing proposal found, generating new one");
      
      // We need to call the edge function to generate a preview
      const SUPABASE_URL = "https://ujyhmchmjzlmsimtrtor.supabase.co";
      const apiUrl = new URL('/functions/v1/generate-proposal', SUPABASE_URL);
      
      // Ensure we have all required calculator input properties
      const updatedCalculatorInputs = {
        aiTier: lead.calculator_inputs?.aiTier || 'growth',
        aiType: lead.calculator_inputs?.aiType || 'both',
        callVolume: lead.calculator_inputs?.callVolume || 0,
        role: lead.calculator_inputs?.role || 'customerService',
        numEmployees: lead.calculator_inputs?.numEmployees || 5,
        avgCallDuration: lead.calculator_inputs?.avgCallDuration || 0,
        chatVolume: lead.calculator_inputs?.chatVolume || 2000,
        avgChatLength: lead.calculator_inputs?.avgChatLength || 0,
        avgChatResolutionTime: lead.calculator_inputs?.avgChatResolutionTime || 0
      };
      
      // Set returnContent to true to get the raw content instead of downloading
      const response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead: {
            ...lead,
            calculator_inputs: updatedCalculatorInputs
          },
          preview: true,
          returnContent: true
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate proposal");
      }
      
      const { proposalContent, title, notes } = await response.json();
      
      console.log("Generated proposal content successfully");
      
      // Save the generated proposal as the first revision
      const newRevision = await saveProposalRevision(
        lead.id,
        proposalContent,
        title || `Proposal for ${lead.company_name || 'Client'}`,
        notes || ""
      );
      
      setCurrentRevision(newRevision);
      setEditableProposal(proposalContent);
      
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
      return null;
    }
  };
  
  // Get all revisions of a proposal for a lead
  const getProposalRevisions = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('proposal_revisions')
        .select('*')
        .eq('lead_id', leadId)
        .order('version_number', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error("Error getting proposal revisions:", error);
      toast({
        title: "Error",
        description: "Failed to load proposal versions",
        variant: "destructive",
      });
      return [];
    }
  };
  
  // Get the latest revision of a proposal for a lead
  const getLatestProposalRevision = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('proposal_revisions')
        .select('*')
        .eq('lead_id', leadId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        // If no revisions exist, this is not an error
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Error getting latest proposal revision:", error);
      // We don't show a toast here since this could be a normal case for new leads
      return null;
    }
  };
  
  // Save a new revision of a proposal
  const saveProposalRevision = async (
    leadId: string,
    proposalContent: string,
    title: string,
    notes: string
  ) => {
    try {
      // Get the next version number
      const { data: versionData, error: versionError } = await supabase
        .rpc('get_next_proposal_version', { p_lead_id: leadId });
        
      if (versionError) throw versionError;
      
      const versionNumber = versionData || 1;
      
      // Create the revision
      const { data, error } = await supabase
        .from('proposal_revisions')
        .insert({
          lead_id: leadId,
          proposal_content: proposalContent,
          version_number: versionNumber,
          title: title,
          notes: notes
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Saved proposal version ${versionNumber}`,
        variant: "default",
      });
      
      return data;
    } catch (error) {
      console.error("Error saving proposal revision:", error);
      toast({
        title: "Error",
        description: `Failed to save proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Generate a professional proposal based on lead data
  const generateProfessionalProposal = (lead: Lead) => {
    console.log("Generating professional proposal for lead:", lead.id);
    
    // IMPORTANT: Ensure calculator_inputs exists and has valid values
    if (!lead.calculator_inputs) {
      lead.calculator_inputs = {
        aiTier: lead.calculator_results?.tierKey || 'growth',
        aiType: lead.calculator_results?.aiType || 'both',
        callVolume: 0
      };
    }
    
    // Generate a base64 PDF string that simulates a PDF
    // This is a placeholder - in a real implementation, this would be
    // a properly formatted PDF document encoded as base64
    const pdfBase64 = `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`;
    
    return pdfBase64;
  };
  
  return {
    isLoading,
    handlePreviewProposal,
    editableProposal,
    setEditableProposal,
    getProposalRevisions,
    getLatestProposalRevision,
    saveProposalRevision,
    generateProfessionalProposal,
    currentRevision,
    setCurrentRevision,
    showPdfPreview,
    setShowPdfPreview
  };
};
