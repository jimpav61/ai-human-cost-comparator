import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { EditProposalButton } from "./components/EditProposalButton";
import { DownloadReportButton } from "./components/DownloadReportButton";
import { PreviewProposalButton } from "./components/PreviewProposalButton";
import { SendProposalButton } from "./components/SendProposalButton";
import { useState, useEffect } from "react";

interface ExtendedDocumentGeneratorProps extends DocumentGeneratorProps {
  onLeadUpdated?: (updatedLead: Lead) => void;
}

export const DocumentGenerator = ({ lead, onLeadUpdated }: ExtendedDocumentGeneratorProps) => {
  // Keep a local copy of the lead to ensure it's up to date
  const [currentLead, setCurrentLead] = useState<Lead>(() => JSON.parse(JSON.stringify(lead)));
  
  // Update internal state when lead prop changes
  useEffect(() => {
    console.log("DocumentGenerator component received lead update:", lead);
    console.log("lead.calculator_inputs.aiTier:", lead.calculator_inputs?.aiTier);
    console.log("lead.calculator_inputs.aiType:", lead.calculator_inputs?.aiType);
    console.log("lead.calculator_inputs.callVolume:", lead.calculator_inputs?.callVolume);
    
    // Deep clone to avoid reference issues
    setCurrentLead(JSON.parse(JSON.stringify(lead)));
  }, [lead]);
  
  // Handle lead updates from child components
  const handleInternalLeadUpdate = (updatedLead: Lead) => {
    console.log("DocumentGenerator received lead update from child:", updatedLead);
    console.log("Updated aiTier:", updatedLead.calculator_inputs?.aiTier);
    console.log("Updated aiType:", updatedLead.calculator_inputs?.aiType);
    console.log("Updated callVolume:", updatedLead.calculator_inputs?.callVolume);
    
    // Update our local state with a deep clone
    setCurrentLead(JSON.parse(JSON.stringify(updatedLead)));
    
    // Pass the update to the parent if handler provided
    if (onLeadUpdated) {
      onLeadUpdated(updatedLead);
    }
  };
  
  // Ensure the callVolume field is always a number
  useEffect(() => {
    if (currentLead.calculator_inputs && typeof currentLead.calculator_inputs.callVolume === 'string') {
      const updatedLead = JSON.parse(JSON.stringify(currentLead));
      updatedLead.calculator_inputs.callVolume = parseInt(updatedLead.calculator_inputs.callVolume, 10) || 0;
      
      console.log("Converting callVolume from string to number:", updatedLead.calculator_inputs.callVolume);
      setCurrentLead(updatedLead);
      
      if (onLeadUpdated) {
        onLeadUpdated(updatedLead);
      }
    }
  }, [currentLead, onLeadUpdated]);
  
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <EditProposalButton 
        lead={currentLead} 
        onLeadUpdated={handleInternalLeadUpdate} 
      />
      
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
