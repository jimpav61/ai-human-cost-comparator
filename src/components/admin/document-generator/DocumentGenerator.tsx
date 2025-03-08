
import { Lead } from "@/types/leads";
import { ProposalGenerator } from "./components/ProposalGenerator";
import { ReportGenerator } from "./components/ReportGenerator";
import { DocumentGeneratorProps } from "./types";
import { Send } from "lucide-react";
import { useEmailProposal } from "./hooks/useEmailProposal";
import { SavedReportsButton } from "./components/SavedReportsButton";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const { sendProposalEmail, isLoading } = useEmailProposal();
  
  return (
    <div className="flex space-x-2">
      <ProposalGenerator lead={lead} />
      <ReportGenerator lead={lead} />
      <SavedReportsButton lead={lead} />
      <button
        onClick={() => sendProposalEmail(lead)}
        disabled={isLoading}
        className="flex items-center px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        <Send className="h-4 w-4 mr-1" />
        {isLoading ? "Sending..." : "Email Proposal"}
      </button>
    </div>
  );
};
