
import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { DownloadReportButton } from "./components/DownloadReportButton";
import { PreviewProposalButton } from "./components/PreviewProposalButton";
import { SendProposalButton } from "./components/SendProposalButton";
import { useState, useEffect } from "react";

interface ExtendedDocumentGeneratorProps extends DocumentGeneratorProps {
  onLeadUpdated?: (updatedLead: Lead) => void;
}

export const DocumentGenerator = ({ lead, onLeadUpdated }: ExtendedDocumentGeneratorProps) => {
  // Keep a local copy of the lead to ensure it's up to date
  const [currentLead, setCurrentLead] = useState<Lead>(() => {
    // Initialize with a deep clone of the lead prop
    const leadCopy = JSON.parse(JSON.stringify(lead));
    
    // Initialize calculator_inputs with defaults if not present
    if (!leadCopy.calculator_inputs || Object.keys(leadCopy.calculator_inputs).length === 0) {
      console.log("Initializing calculator_inputs with defaults");
      leadCopy.calculator_inputs = {
        aiTier: leadCopy.calculator_results?.tierKey || 'growth',
        aiType: leadCopy.calculator_results?.aiType || 'both',
        callVolume: 0,
        role: 'customerService',
        numEmployees: leadCopy.employee_count || 5,
        chatVolume: 2000,
        avgCallDuration: 0,
        avgChatLength: 0,
        avgChatResolutionTime: 0
      };
    }
    
    // CRITICAL FIX: Always ensure callVolume is a number
    if (typeof leadCopy.calculator_inputs.callVolume === 'string') {
      leadCopy.calculator_inputs.callVolume = parseInt(leadCopy.calculator_inputs.callVolume, 10) || 0;
      console.log("DocumentGenerator init: Converted callVolume from string to number:", leadCopy.calculator_inputs.callVolume);
    } else if (leadCopy.calculator_inputs.callVolume === undefined || leadCopy.calculator_inputs.callVolume === null) {
      leadCopy.calculator_inputs.callVolume = 0;
      console.log("DocumentGenerator init: Set missing callVolume to 0");
    }
    
    return leadCopy;
  });
  
  // Log current state for debugging
  useEffect(() => {
    console.log("DocumentGenerator initialized with lead:", lead.id);
    console.log("Current lead calculator_inputs:", currentLead.calculator_inputs);
    console.log("Current lead calculator_results:", currentLead.calculator_results);
    console.log("Additional voice minutes:", currentLead.calculator_inputs.callVolume, typeof currentLead.calculator_inputs.callVolume);
  }, []);
  
  // Update internal state when lead prop changes
  useEffect(() => {
    console.log("DocumentGenerator component received lead update:", lead);
    console.log("lead.calculator_inputs.aiTier:", lead.calculator_inputs?.aiTier);
    console.log("lead.calculator_inputs.aiType:", lead.calculator_inputs?.aiType);
    console.log("lead.calculator_inputs.callVolume:", lead.calculator_inputs?.callVolume, "type:", typeof lead.calculator_inputs?.callVolume);
    
    // Deep clone to avoid reference issues
    const leadCopy = JSON.parse(JSON.stringify(lead));
    
    // Make sure calculator_inputs exists
    if (!leadCopy.calculator_inputs || Object.keys(leadCopy.calculator_inputs).length === 0) {
      console.log("Received lead update with empty calculator_inputs, initializing with defaults");
      leadCopy.calculator_inputs = {
        aiTier: leadCopy.calculator_results?.tierKey || 'growth',
        aiType: leadCopy.calculator_results?.aiType || 'both',
        callVolume: 0,
        role: 'customerService',
        numEmployees: leadCopy.employee_count || 5,
        chatVolume: 2000,
        avgCallDuration: 0,
        avgChatLength: 0,
        avgChatResolutionTime: 0
      };
    }
    
    // CRITICAL FIX: Always ensure callVolume is a number
    if (typeof leadCopy.calculator_inputs.callVolume === 'string') {
      leadCopy.calculator_inputs.callVolume = parseInt(leadCopy.calculator_inputs.callVolume, 10) || 0;
      console.log("DocumentGenerator update: Converted callVolume from string to number:", leadCopy.calculator_inputs.callVolume);
    } else if (leadCopy.calculator_inputs.callVolume === undefined || leadCopy.calculator_inputs.callVolume === null) {
      leadCopy.calculator_inputs.callVolume = 0;
      console.log("DocumentGenerator update: Set missing callVolume to 0");
    }
    
    // IMPORTANT: Make sure calculator_results has the most up-to-date callVolume for proposal generation
    if (leadCopy.calculator_results && leadCopy.calculator_results.aiCostMonthly) {
      // Calculate the voice cost based on callVolume (12¢ per minute)
      const voiceCost = leadCopy.calculator_inputs.callVolume * 0.12;
      leadCopy.calculator_results.aiCostMonthly.voice = voiceCost;
      
      // Update the total cost
      const basePriceMonthly = leadCopy.calculator_results.basePriceMonthly || 0;
      leadCopy.calculator_results.aiCostMonthly.total = basePriceMonthly + voiceCost;
      
      console.log("Updated calculator_results with voice cost:", voiceCost);
      console.log("Updated calculator_results total:", leadCopy.calculator_results.aiCostMonthly.total);
    }
    
    setCurrentLead(leadCopy);
  }, [lead]);
  
  // Handle lead updates from child components
  const handleInternalLeadUpdate = (updatedLead: Lead) => {
    console.log("DocumentGenerator received lead update from child:", updatedLead);
    console.log("Updated aiTier:", updatedLead.calculator_inputs?.aiTier);
    console.log("Updated aiType:", updatedLead.calculator_inputs?.aiType);
    console.log("Updated callVolume:", updatedLead.calculator_inputs?.callVolume, "type:", typeof updatedLead.calculator_inputs?.callVolume);
    
    // Update our local state with a deep clone
    const updatedLeadCopy = JSON.parse(JSON.stringify(updatedLead));
    
    // CRITICAL FIX: Always ensure callVolume is a number before passing it on
    if (typeof updatedLeadCopy.calculator_inputs.callVolume === 'string') {
      updatedLeadCopy.calculator_inputs.callVolume = parseInt(updatedLeadCopy.calculator_inputs.callVolume, 10) || 0;
      console.log("DocumentGenerator handleInternalLeadUpdate: Converted callVolume from string to number:", updatedLeadCopy.calculator_inputs.callVolume);
    } else if (updatedLeadCopy.calculator_inputs.callVolume === undefined || updatedLeadCopy.calculator_inputs.callVolume === null) {
      updatedLeadCopy.calculator_inputs.callVolume = 0;
      console.log("DocumentGenerator handleInternalLeadUpdate: Set missing callVolume to 0");
    }
    
    // Update calculator_results with the voice cost based on callVolume
    if (updatedLeadCopy.calculator_results && updatedLeadCopy.calculator_results.aiCostMonthly) {
      // Calculate the voice cost based on callVolume (12¢ per minute)
      const voiceCost = updatedLeadCopy.calculator_inputs.callVolume * 0.12;
      updatedLeadCopy.calculator_results.aiCostMonthly.voice = voiceCost;
      
      // Update the total cost
      const basePriceMonthly = updatedLeadCopy.calculator_results.basePriceMonthly || 0;
      updatedLeadCopy.calculator_results.aiCostMonthly.total = basePriceMonthly + voiceCost;
      
      console.log("Updated calculator_results with voice cost:", voiceCost);
      console.log("Updated calculator_results total:", updatedLeadCopy.calculator_results.aiCostMonthly.total);
    }
    
    setCurrentLead(updatedLeadCopy);
    
    // Pass the update to the parent if handler provided
    if (onLeadUpdated) {
      onLeadUpdated(updatedLeadCopy);
    }
  };
  
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <DownloadReportButton 
        lead={currentLead} 
      />
      
      <PreviewProposalButton 
        lead={currentLead} 
      />
      
      <SendProposalButton 
        lead={currentLead} 
      />
    </div>
  );
};
