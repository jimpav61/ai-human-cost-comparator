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
  const [currentLead, setCurrentLead] = useState<Lead>(JSON.parse(JSON.stringify(lead)));
  
  // Update internal state when lead prop changes
  useEffect(() => {
    console.log("DocumentGenerator component received lead update:", lead);
    setCurrentLead(JSON.parse(JSON.stringify(lead)));
  }, [lead]);
  
  // Handle lead updates from child components
  const handleInternalLeadUpdate = (updatedLead: Lead) => {
    console.log("DocumentGenerator received lead update from child:", updatedLead);
    
    // Update our local state
    setCurrentLead(JSON.parse(JSON.stringify(updatedLead)));
    
    // Pass the update to the parent if handler provided
    if (onLeadUpdated) {
      onLeadUpdated(updatedLead);
    }
  };
  
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
