
import { Lead } from "@/types/leads";
import { ProposalGenerator } from "./components/ProposalGenerator";
import { DocumentGeneratorProps } from "./types";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  return (
    <div className="flex space-x-2">
      <ProposalGenerator lead={lead} />
    </div>
  );
};
