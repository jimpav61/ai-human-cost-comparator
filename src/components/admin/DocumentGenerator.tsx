
import { DocumentGenerator as NewDocumentGenerator } from "./document-generator/DocumentGenerator";
import { Lead } from "@/types/leads";

interface DocumentGeneratorProps {
  lead: Lead;
}

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  return (
    <div>
      <NewDocumentGenerator lead={lead} />
    </div>
  );
};
