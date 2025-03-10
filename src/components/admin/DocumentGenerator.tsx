
import { DocumentGenerator as NewDocumentGenerator } from "./document-generator/DocumentGenerator";
import { Lead } from "@/types/leads";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";

interface DocumentGeneratorProps {
  lead: Lead;
}

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  // Make sure we're passing the correct lead data with proper calculator_inputs
  console.log("DocumentGenerator lead data:", lead);
  
  // Ensure calculator results are complete before passing to the document generator
  if (lead.calculator_results) {
    lead.calculator_results = ensureCompleteCalculatorResults(lead.calculator_results);
  }
  
  return (
    <div>
      <NewDocumentGenerator lead={lead} />
    </div>
  );
};
