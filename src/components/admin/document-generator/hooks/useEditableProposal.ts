import { useState } from "react";
import { Lead } from "@/types/leads";
import { ProposalRevision } from "./useProposalRevisions";

// Define a consistent set of allowed AI types for better type safety
export type AIType = "voice" | "chatbot" | "both" | "conversationalVoice" | "both-premium";
export type AITier = "starter" | "growth" | "premium";

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
  const [editingAiTier, setEditingAiTier] = useState<AITier>("growth");
  const [editingAiType, setEditingAiType] = useState<AIType>("both");
  const [editingCallVolume, setEditingCallVolume] = useState(0);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");
  
  // Initialize form state from lead data
  const initializeFromLead = (lead: Lead) => {
    // Safely handle AITier
    const aiTier = lead.calculator_inputs?.aiTier;
    if (aiTier === 'starter' || aiTier === 'growth' || aiTier === 'premium') {
      setEditingAiTier(aiTier);
    } else {
      setEditingAiTier('growth'); // Default to growth if invalid
    }
    
    // Safely handle AIType
    const aiType = lead.calculator_inputs?.aiType;
    if (aiType === 'voice' || aiType === 'chatbot' || aiType === 'both' || 
        aiType === 'conversationalVoice' || aiType === 'both-premium') {
      setEditingAiType(aiType);
    } else {
      // Default to 'both' if the value is invalid
      setEditingAiType('both');
    }
    
    // Ensure callVolume is a number
    setEditingCallVolume(
      typeof lead.calculator_inputs?.callVolume === 'number' 
        ? lead.calculator_inputs.callVolume 
        : typeof lead.calculator_inputs?.callVolume === 'string'
          ? parseInt(lead.calculator_inputs.callVolume, 10) || 0
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
      
      // Safely handle aiTier
      if (notesData.aiTier === 'starter' || notesData.aiTier === 'growth' || notesData.aiTier === 'premium') {
        setEditingAiTier(notesData.aiTier);
      }
      
      // Safely handle aiType with proper type checking
      if (notesData.aiType) {
        const aiType = notesData.aiType;
        if (aiType === 'voice' || aiType === 'chatbot' || aiType === 'both' || 
            aiType === 'conversationalVoice' || aiType === 'both-premium') {
          setEditingAiType(aiType);
        }
      }
      
      // Ensure callVolume is a number
      if (notesData.callVolume !== undefined) {
        setEditingCallVolume(
          typeof notesData.callVolume === 'number' 
            ? notesData.callVolume 
            : parseInt(String(notesData.callVolume), 10) || 0
        );
      }
    } catch (e) {
      // If notes isn't JSON, just continue with existing data
      console.log("Error parsing proposal notes JSON:", e);
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
  const handleTierChange = (newTier: AITier) => {
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
  const handleAITypeChange = (newType: AIType) => {
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
  
  // Create a unified document data structure that combines all editable fields
  const getUnifiedDocumentData = (lead: Lead): Lead => {
    // Start with the existing lead
    const updatedLead: Lead = {
      ...lead,
      calculator_inputs: {
        ...lead.calculator_inputs,
        aiTier: editingAiTier,
        aiType: editingAiType,
        callVolume: editingCallVolume
      }
    };
    
    // If calculator_results doesn't exist, initialize it with basic structure
    if (!updatedLead.calculator_results) {
      updatedLead.calculator_results = {
        aiCostMonthly: {
          voice: 0,
          chatbot: 0,
          total: 0,
          setupFee: 0
        },
        basePriceMonthly: 0,
        humanCostMonthly: 0,
        monthlySavings: 0,
        yearlySavings: 0,
        savingsPercentage: 0,
        breakEvenPoint: {
          voice: 0,
          chatbot: 0
        },
        humanHours: {
          dailyPerEmployee: 0,
          weeklyTotal: 0,
          monthlyTotal: 0,
          yearlyTotal: 0
        },
        annualPlan: 0,
        includedVoiceMinutes: 0
      };
    }
    
    // Update key values based on current settings
    const pricing = calculatePrice();
    updatedLead.calculator_results.tierKey = editingAiTier;
    updatedLead.calculator_results.aiType = editingAiType;
    updatedLead.calculator_results.basePriceMonthly = pricing.basePrice;
    updatedLead.calculator_results.aiCostMonthly.total = pricing.totalPrice;
    
    // Set included voice minutes based on tier
    updatedLead.calculator_results.includedVoiceMinutes = pricing.includedMinutes;
    updatedLead.calculator_results.additionalVoiceMinutes = editingCallVolume;
    
    return updatedLead;
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
    handleAITypeChange,
    getUnifiedDocumentData
  };
};
