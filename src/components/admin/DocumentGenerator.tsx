
import { DocumentGenerator as NewDocumentGenerator } from "./document-generator/DocumentGenerator";
import { Lead } from "@/types/leads";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";

interface DocumentGeneratorProps {
  lead: Lead;
}

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  // Make sure we're passing the correct lead data with proper calculator_inputs
  console.log("DocumentGenerator lead data:", lead);
  console.log("DocumentGenerator callVolume:", lead.calculator_inputs?.callVolume);
  
  // Ensure calculator results are complete before passing to the document generator
  if (lead.calculator_results) {
    lead.calculator_results = ensureCompleteCalculatorResults(lead.calculator_results);
  }
  
  // Ensure callVolume is a number
  if (lead.calculator_inputs && typeof lead.calculator_inputs.callVolume === 'string') {
    lead.calculator_inputs.callVolume = parseInt(lead.calculator_inputs.callVolume, 10) || 0;
    console.log("Converted calculator_inputs.callVolume from string to number:", lead.calculator_inputs.callVolume);
  }
  
  return (
    <div>
      <NewDocumentGenerator lead={lead} />
    </div>
  );
};
