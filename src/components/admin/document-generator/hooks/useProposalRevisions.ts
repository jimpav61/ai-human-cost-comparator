
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface ProposalRevision {
  id: string;
  lead_id: string;
  version_number: number;
  proposal_content: string;
  title: string;
  notes: string;
  created_at: string;
  created_by?: string;
  is_sent: boolean;
}

export const useProposalRevisions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentRevision, setCurrentRevision] = useState<ProposalRevision | null>(null);
  
  // Get all proposal revisions for a lead
  const getProposalRevisions = async (leadId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('proposal_revisions')
        .select('*')
        .eq('lead_id', leadId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      
      setIsLoading(false);
      return data || [];
    } catch (error) {
      console.error("Error fetching proposal revisions:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: `Failed to fetch proposal revisions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      return [];
    }
  };
  
  // Get the next version number for a lead
  const getNextVersionNumber = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_next_proposal_version', { p_lead_id: leadId });
      
      if (error) throw error;
      
      return data || 1;
    } catch (error) {
      console.error("Error getting next version number:", error);
      // Fallback to client-side calculation if RPC fails
      const revisions = await getProposalRevisions(leadId);
      const maxVersion = revisions.reduce(
        (max, rev) => Math.max(max, rev.version_number), 0
      );
      return maxVersion + 1;
    }
  };
  
  // Save a proposal revision
  const saveProposalRevision = async (
    leadId: string, 
    proposalContent: string,
    title: string = "Proposal",
    notes: string = "",
    isSent: boolean = false
  ) => {
    try {
      setIsLoading(true);
      
      // Get the next version number
      const versionNumber = await getNextVersionNumber(leadId);
      
      // Get current user's ID if available
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      
      // Save the proposal revision
      const { data, error } = await supabase
        .from('proposal_revisions')
        .insert({
          lead_id: leadId,
          version_number: versionNumber,
          proposal_content: proposalContent,
          title,
          notes,
          created_by: userId || null,
          is_sent: isSent
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      setIsLoading(false);
      setCurrentRevision(data);
      
      toast({
        title: "Success",
        description: `Proposal revision v${versionNumber} saved successfully`,
        variant: "default",
      });
      
      return data;
    } catch (error) {
      console.error("Error saving proposal revision:", error);
      setIsLoading(false);
      
      toast({
        title: "Error",
        description: `Failed to save proposal revision: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  // Get the latest proposal revision for a lead
  const getLatestProposalRevision = async (leadId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('proposal_revisions')
        .select('*')
        .eq('lead_id', leadId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        // If no revision found, it's not really an error
        if (error.code === 'PGRST116') {
          setIsLoading(false);
          return null;
        }
        throw error;
      }
      
      setIsLoading(false);
      setCurrentRevision(data);
      return data;
    } catch (error) {
      console.error("Error fetching latest proposal revision:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: `Failed to fetch latest proposal revision: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Generate a PDF from a specific revision
  const generatePdfFromRevision = async (revision: ProposalRevision) => {
    try {
      setIsLoading(true);
      
      // Extract lead data from the proposal content
      let leadData: any;
      try {
        leadData = JSON.parse(revision.proposal_content);
      } catch (e) {
        // If content isn't valid JSON, use a simpler object
        leadData = {
          id: revision.lead_id,
          version_info: {
            version_number: revision.version_number,
            created_at: revision.created_at,
            notes: revision.notes
          }
        };
      }
      
      // Call the edge function to generate the PDF
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: { 
          lead: leadData,
          mode: "preview",
          returnContent: true,
          version: revision.version_number
        }
      });
      
      if (error) throw error;
      
      setIsLoading(false);
      
      return data.pdf;
    } catch (error) {
      console.error("Error generating PDF from revision:", error);
      setIsLoading(false);
      
      toast({
        title: "Error",
        description: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  // Update an existing proposal revision
  const updateProposalRevision = async (
    revisionId: string,
    updates: {
      proposal_content?: string;
      title?: string;
      notes?: string;
      is_sent?: boolean;
    }
  ) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('proposal_revisions')
        .update(updates)
        .eq('id', revisionId)
        .select('*')
        .single();
      
      if (error) throw error;
      
      setIsLoading(false);
      setCurrentRevision(data);
      
      toast({
        title: "Success",
        description: "Proposal revision updated successfully",
        variant: "default",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating proposal revision:", error);
      setIsLoading(false);
      
      toast({
        title: "Error",
        description: `Failed to update proposal revision: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  return {
    isLoading,
    currentRevision,
    setCurrentRevision,
    getProposalRevisions,
    getNextVersionNumber,
    saveProposalRevision,
    getLatestProposalRevision,
    generatePdfFromRevision,
    updateProposalRevision
  };
};
