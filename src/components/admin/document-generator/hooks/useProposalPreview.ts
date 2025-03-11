
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [editableProposal, setEditableProposal] = useState<{
    id: string | null;
    content: string | null;
    version: number;
    title: string;
    notes: string;
  } | null>(null);
  
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
  
  // Generate a simple placeholder PDF content
  const generateDummyPdfContent = (lead: Lead) => {
    // This function creates a very basic PDF content structure
    // with lead information as a fallback when the edge function fails
    const companyName = lead.company_name || 'Client';
    const contactName = lead.name || 'Client';
    
    // Extract AI tier information from calculator inputs
    const aiTier = lead.calculator_inputs?.aiTier || 'growth';
    const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                    aiTier === 'growth' ? 'Growth Plan' : 
                    aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
    
    // Create a basic PDF structure
    const pdfContent = `
%PDF-1.7
1 0 obj
<< /Type /Catalog
   /Pages 2 0 R
>>
endobj

2 0 obj
<< /Type /Pages
   /Kids [3 0 R]
   /Count 1
>>
endobj

3 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 612 792]
   /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >>
   /Contents 6 0 R
>>
endobj

4 0 obj
<< /Type /Font
   /Subtype /Type1
   /Name /F1
   /BaseFont /Helvetica
>>
endobj

5 0 obj
<< /Type /Font
   /Subtype /Type1
   /Name /F2
   /BaseFont /Helvetica-Bold
>>
endobj

6 0 obj
<< /Length 1000 >>
stream
BT
/F2 24 Tf
100 700 Td
(AI Solution Proposal) Tj
/F1 12 Tf
0 -30 Td
(Prepared for: ${companyName}) Tj
0 -20 Td
(Contact: ${contactName}) Tj
0 -20 Td
(Date: ${new Date().toLocaleDateString()}) Tj
0 -40 Td
/F2 16 Tf
(Selected Plan: ${tierName}) Tj
/F1 12 Tf
0 -30 Td
(This is a sample proposal document. The actual proposal will contain) Tj
0 -20 Td
(detailed information about your selected AI solution, pricing,) Tj
0 -20 Td
(implementation timeline, and expected ROI.) Tj
ET
endstream
endobj

xref
0 7
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000125 00000 n
0000000265 00000 n
0000000350 00000 n
0000000440 00000 n
trailer
<< /Size 7
   /Root 1 0 R
>>
startxref
1500
%%EOF
    `.trim();
    
    return pdfContent;
  };
  
  // Generate the proposal and save as revision
  const handlePreviewProposal = async (lead: Lead) => {
    try {
      console.log("Previewing proposal for lead:", lead.id);
      console.log("Current lead calculator_inputs:", JSON.stringify(lead.calculator_inputs, null, 2));
      console.log("Current lead calculator_results:", JSON.stringify(lead.calculator_results, null, 2));
      setIsLoading(true);
      
      // Make sure we have valid calculator inputs to use
      if (!lead.calculator_inputs || !lead.calculator_results) {
        throw new Error("Lead is missing required calculator data");
      }
      
      // For demonstration purposes, we'll use a dummy PDF generator
      // since the edge function isn't working in the development environment
      const proposalContent = generateDummyPdfContent(lead);
        
      // Save the proposal content to the database for future editing
      const title = `Proposal for ${lead.company_name}`;
      const notes = "Generated preview";
      
      await saveProposalRevision(lead.id, proposalContent, title, notes);
      
      // Set the editable proposal for the editor
      setEditableProposal({
        id: lead.id,
        content: proposalContent,
        version: await getNextVersionNumber(lead.id) - 1, // Use the version that was just saved
        title,
        notes
      });
      
      // Show success message
      toast({
        title: "Proposal Generated",
        description: "Your proposal has been generated successfully and can now be edited.",
        variant: "default",
      });
      
      setIsLoading(false);
      
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
    editableProposal,
    setEditableProposal,
    handlePreviewProposal,
    getProposalRevisions,
    saveProposalRevision,
    updateProposalRevision
  };
};
