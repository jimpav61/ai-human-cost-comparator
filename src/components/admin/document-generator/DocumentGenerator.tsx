
import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { EditProposalButton } from "./components/EditProposalButton";
import { DownloadReportButton } from "./components/DownloadReportButton";
import { PreviewProposalButton } from "./components/PreviewProposalButton";
import { SendProposalButton } from "./components/SendProposalButton";

interface ExtendedDocumentGeneratorProps extends DocumentGeneratorProps {
  onLeadUpdated?: (updatedLead: Lead) => void;
}

export const DocumentGenerator = ({ lead, onLeadUpdated }: ExtendedDocumentGeneratorProps) => {
  // Every button has its own state and handlers, isolated in their respective components
  
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <EditProposalButton 
        lead={lead} 
        onLeadUpdated={onLeadUpdated} 
      />
      
      <DownloadReportButton 
        lead={lead} 
      />
      
      <PreviewProposalButton 
        lead={lead} 
      />
      
      <SendProposalButton 
        lead={lead} 
      />
    </div>
  );
};
