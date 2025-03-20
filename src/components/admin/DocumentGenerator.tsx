
import { useState, useEffect } from "react";
import { DocumentGenerator as NewDocumentGenerator } from "./document-generator/DocumentGenerator";
import { Lead } from "@/types/leads";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";

interface DocumentGeneratorProps {
  lead: Lead;
  onLeadUpdated?: (updatedLead: Lead) => void;
}

export const DocumentGenerator = ({ lead, onLeadUpdated }: DocumentGeneratorProps) => {
  // Create a state variable to track when the lead is updated
  const [currentLead, setCurrentLead] = useState<Lead>(() => {
    // Create a deep copy to avoid reference issues when initializing
    const leadCopy = JSON.parse(JSON.stringify(lead));
    
    // Ensure calculator results are complete before passing to the document generator
    if (leadCopy.calculator_results) {
      leadCopy.calculator_results = ensureCompleteCalculatorResults(leadCopy.calculator_results);
    }
    
    // Ensure callVolume is a number
    if (leadCopy.calculator_inputs && typeof leadCopy.calculator_inputs.callVolume === 'string') {
      leadCopy.calculator_inputs.callVolume = parseInt(leadCopy.calculator_inputs.callVolume, 10) || 0;
      console.log("Converted calculator_inputs.callVolume from string to number:", leadCopy.calculator_inputs.callVolume);
    }
    
    return leadCopy;
  });
  
  // Update the current lead whenever the parent component provides a new lead
  useEffect(() => {
    console.log("DocumentGenerator received updated lead from parent:", lead);
    
    // Create a deep copy to avoid reference issues
    const leadCopy = JSON.parse(JSON.stringify(lead));
    
    // Ensure calculator results are complete
    if (leadCopy.calculator_results) {
      leadCopy.calculator_results = ensureCompleteCalculatorResults(leadCopy.calculator_results);
    }
    
    // Ensure callVolume is a number
    if (leadCopy.calculator_inputs && typeof leadCopy.calculator_inputs.callVolume === 'string') {
      leadCopy.calculator_inputs.callVolume = parseInt(leadCopy.calculator_inputs.callVolume, 10) || 0;
      console.log("Converted calculator_inputs.callVolume from string to number:", leadCopy.calculator_inputs.callVolume);
    }
    
    setCurrentLead(leadCopy);
  }, [lead]);
  
  // Handle updates to the lead data
  const handleLeadUpdate = (updatedLead: Lead) => {
    console.log("DocumentGenerator received updated lead from child:", updatedLead);
    
    // Create a deep copy to avoid reference issues
    const updatedLeadCopy = JSON.parse(JSON.stringify(updatedLead));
    
    // Ensure callVolume is a number
    if (updatedLeadCopy.calculator_inputs && typeof updatedLeadCopy.calculator_inputs.callVolume === 'string') {
      updatedLeadCopy.calculator_inputs.callVolume = parseInt(updatedLeadCopy.calculator_inputs.callVolume, 10) || 0;
      console.log("Converted updated callVolume from string to number:", updatedLeadCopy.calculator_inputs.callVolume);
    }
    
    // Update our local state with the new lead data
    setCurrentLead(updatedLeadCopy);
    
    // Pass the update to the parent if handler provided
    if (onLeadUpdated) {
      onLeadUpdated(updatedLeadCopy);
    }
  };
  
  return (
    <button className="text-xs md:text-sm px-2 py-1 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
      <NewDocumentGenerator 
        lead={currentLead} 
        onLeadUpdated={handleLeadUpdate} 
      />
    </button>
  );
};
