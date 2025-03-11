
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [editableProposal, setEditableProposal] = useState<string | null>(null);
  const [currentRevision, setCurrentRevision] = useState<any>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  
  const handlePreviewProposal = async (lead: Lead) => {
    try {
      console.log("Previewing proposal for lead:", lead.id);
      console.log("Current lead calculator_inputs:", lead.calculator_inputs);
      console.log("Current lead calculator_results:", lead.calculator_results);
      
      setIsLoading(true);
      
      const latestRevision = await getLatestProposalRevision(lead.id);
      
      if (latestRevision) {
        console.log("Found existing proposal, using it:", latestRevision.id);
        setCurrentRevision(latestRevision);
        setEditableProposal(latestRevision.proposal_content);
        return latestRevision;
      }
      
      console.log("No existing proposal found, generating new one");
      
      const SUPABASE_URL = "https://ujyhmchmjzlmsimtrtor.supabase.co";
      const apiUrl = new URL('/functions/v1/generate-proposal', SUPABASE_URL);
      
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
      
      const updatedLead = {
        ...lead,
        calculator_inputs: updatedCalculatorInputs
      };
      
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
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Error getting latest proposal revision:", error);
      return null;
    }
  };
  
  const saveProposalRevision = async (
    leadId: string,
    proposalContent: string,
    title: string,
    notes: string
  ) => {
    try {
      const { data: versionData, error: versionError } = await supabase
        .rpc('get_next_proposal_version', { p_lead_id: leadId });
        
      if (versionError) throw versionError;
      
      const versionNumber = versionData || 1;
      
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
  
  const generateProfessionalProposal = (lead: Lead) => {
    console.log("Generating professional proposal for lead:", lead.id);
    
    if (!lead.calculator_inputs) {
      lead.calculator_inputs = {
        aiTier: lead.calculator_results?.tierKey || 'growth',
        aiType: lead.calculator_results?.aiType || 'both',
        callVolume: 0,
        role: 'customerService',
        numEmployees: lead.employee_count || 5,
        avgCallDuration: 0,
        chatVolume: 2000,
        avgChatLength: 0,
        avgChatResolutionTime: 0
      };
    }
    
    const pdfBase64 = "JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDEgMCBSIC9MYXN0TW9kaWZpZWQgKEQOMjAyMzExMTYxNDQ1NTcrMDAnMDAnKSAvUmVzb3VyY2VzIDIgMCBSIC9NZWRpYUJveCBbMC4wMDAwMDAgMC4wMDAwMDAgNTk1LjI3NjAwMCA4NDEuODkwMDAwXSAvQ3JvcEJveCBbMC4wMDAwMDAgMC4wMDAwMDAgNTk1LjI3NjAwMCA4NDEuODkwMDAwXSAvQmxlZWRCb3ggWzAuMDAwMDAwIDAuMDAwMDAwIDU5NS4yNzYwMDAgODQxLjg5MDAwMF0gL1RyaW1Cb3ggWzAuMDAwMDAwIDAuMDAwMDAwIDU5NS4yNzYwMDAgODQxLjg5MDAwMF0gL0FydEJveCBbMC4wMDAwMDAgMC4wMDAwMDAgNTk1LjI3NjAwMCA4NDEuODkwMDAwXSAvQ29udGVudHMgMTAgMCBSIC9Sb3RhdGUgMCAvR3JvdXAgPDwgL1R5cGUgL0dyb3VwIC9TIC9UcmFuc3BhcmVuY3kgL0NTIC9EZXZpY2VSR0IgPj4gL0Fubm90cyBbIDggMCBSIF0gL1BaIDEgPj4KZW5kb2JqCjEwIDAgb2JqCjw8IC9MZW5ndGggMTEgMCBSIC9GaWx0ZXIgL0ZsYXRlRGVjb2RlID4+CnN0cmVhbQo=";
    
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
