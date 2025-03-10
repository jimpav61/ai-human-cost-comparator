
import { DocumentGenerator as NewDocumentGenerator } from "./document-generator/DocumentGenerator";
import { Lead } from "@/types/leads";

interface DocumentGeneratorProps {
  lead: Lead;
}

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  // Make sure we're passing the correct lead data with proper calculator_inputs
  console.log("DocumentGenerator lead data:", lead);
  
  return (
    <div>
      <NewDocumentGenerator lead={lead} />
    </div>
  );
};
