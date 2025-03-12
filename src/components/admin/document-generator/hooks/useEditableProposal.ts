
import { useState } from "react";
import { Lead } from "@/types/leads";
import { ProposalRevision } from "./useProposalRevisions";

interface EditableProposal {
  id: string | null;
  content: string | null;
  version: number;
  title: string;
  notes: string;
}

export const useEditableProposal = () => {
  const [editableProposal, setEditableProposal] = useState<EditableProposal | null>(null);
  const [proposalVersions, setProposalVersions] = useState<ProposalRevision[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ProposalRevision | null>(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  
  // Form state for proposal editing
  const [editingAiTier, setEditingAiTier] = useState<"starter" | "growth" | "premium">("growth");
  // Ensure aiType is properly typed for strict type checking
  const [editingAiType, setEditingAiType] = useState<"voice" | "chatbot" | "both" | "conversationalVoice" | "both-premium">("both");
  const [editingCallVolume, setEditingCallVolume] = useState(0);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");
  
  // Initialize form state from lead data
  const initializeFromLead = (lead: Lead) => {
    setEditingAiTier((lead.calculator_inputs?.aiTier as any) || 'growth');
    
    // Ensure aiType is properly set with type checking
    const aiType = lead.calculator_inputs?.aiType;
    if (aiType === 'voice' || aiType === 'chatbot' || aiType === 'both' || 
        aiType === 'conversationalVoice' || aiType === 'both-premium') {
      setEditingAiType(aiType);
    } else {
      // Default to 'both' if the value is invalid
      setEditingAiType('both');
    }
    
    setEditingCallVolume(
      typeof lead.calculator_inputs?.callVolume === 'number' 
        ? lead.calculator_inputs.callVolume 
        : 0
    );
  };
  
  // Update form with version data
  const loadProposalVersion = (version: ProposalRevision) => {
    setSelectedVersion(version);
    
    if (editableProposal) {
      setEditableProposal({
        ...editableProposal,
        content: version.proposal_content,
        version: version.version_number,
        title: version.title,
        notes: version.notes || ""
      });
    }
    
    setProposalTitle(version.title);
    setProposalNotes(version.notes || "");
    
    // Try to extract AI settings from notes JSON if available
    try {
      const notesData = JSON.parse(version.notes || "{}");
      if (notesData.aiTier) setEditingAiTier(notesData.aiTier as any);
      
      // Handle aiType with proper type checking
      if (notesData.aiType) {
        const aiType = notesData.aiType;
        if (aiType === 'voice' || aiType === 'chatbot' || aiType === 'both' || 
            aiType === 'conversationalVoice' || aiType === 'both-premium') {
          setEditingAiType(aiType);
        }
      }
      
      if (notesData.callVolume !== undefined) setEditingCallVolume(notesData.callVolume);
    } catch (e) {
      // If notes isn't JSON, just continue with existing data
    }
  };
  
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
  
  // Handle changes to AI tier with proper AI type adjustment
  const handleTierChange = (newTier: "starter" | "growth" | "premium") => {
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
  const handleAITypeChange = (newType: "voice" | "chatbot" | "both" | "conversationalVoice" | "both-premium") => {
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
  
  return {
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
    handleAITypeChange
  };
};
