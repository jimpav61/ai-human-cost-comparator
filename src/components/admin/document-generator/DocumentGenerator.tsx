
import { Lead } from "@/types/leads";
import { ReportGenerator } from "./components/ReportGenerator";
import { ProposalGenerator } from "./components/ProposalGenerator";
import { DocumentGeneratorProps } from "./types";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  return (
    <div className="flex space-x-2">
      <ReportGenerator lead={lead} />
      <ProposalGenerator lead={lead} />
    </div>
  );
};
