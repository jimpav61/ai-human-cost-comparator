
import { DocumentGenerator as NewDocumentGenerator } from "./document-generator/DocumentGenerator";
import { Lead } from "@/types/leads";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";
import { useState, useEffect } from "react";

interface DocumentGeneratorProps {
  lead: Lead;
}

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  // Create a state variable to track when the lead is updated
  const [currentLead, setCurrentLead] = useState<Lead>(lead);
  
  // Update the current lead whenever the parent component provides a new lead
  useEffect(() => {
    setCurrentLead(lead);
  }, [lead]);
  
  // Make sure we're passing the correct lead data with proper calculator_inputs
  console.log("DocumentGenerator lead data:", currentLead);
  console.log("DocumentGenerator callVolume:", currentLead.calculator_inputs?.callVolume);
  
  // Ensure calculator results are complete before passing to the document generator
  if (currentLead.calculator_results) {
    currentLead.calculator_results = ensureCompleteCalculatorResults(currentLead.calculator_results);
  }
  
  // Ensure callVolume is a number
  if (currentLead.calculator_inputs && typeof currentLead.calculator_inputs.callVolume === 'string') {
    currentLead.calculator_inputs.callVolume = parseInt(currentLead.calculator_inputs.callVolume, 10) || 0;
    console.log("Converted calculator_inputs.callVolume from string to number:", currentLead.calculator_inputs.callVolume);
  }
  
  // Handle updates to the lead data
  const handleLeadUpdate = (updatedLead: Lead) => {
    console.log("DocumentGenerator received updated lead:", updatedLead);
    console.log("Updated callVolume:", updatedLead.calculator_inputs?.callVolume);
    
    // Update our local state with the new lead data
    setCurrentLead(updatedLead);
  };
  
  return (
    <div>
      <NewDocumentGenerator 
        lead={currentLead} 
        onLeadUpdated={handleLeadUpdate} 
      />
    </div>
  );
};
