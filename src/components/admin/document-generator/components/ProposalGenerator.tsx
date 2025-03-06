
import { Lead } from "@/types/leads";
import { FileDown } from "lucide-react";
import { DownloadButton } from "./DownloadButton";
import { useProposalGenerator } from "../hooks/useProposalGenerator";

interface ProposalGeneratorProps {
  lead: Lead;
}

export const ProposalGenerator = ({ lead }: ProposalGeneratorProps) => {
  const { generateProposalDocument, hasDownloaded } = useProposalGenerator({ lead });

  return (
    <DownloadButton
      hasDownloaded={hasDownloaded}
      label="Proposal"
      downloadedLabel="Downloaded"
      icon={<FileDown className="h-4 w-4 mr-1" />}
      onClick={generateProposalDocument}
    />
  );
};
