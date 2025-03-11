
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
    console.log("DocumentGenerator received updated lead from parent:", lead);
    
    // Create a deep copy to avoid reference issues
    const leadCopy = JSON.parse(JSON.stringify(lead));
    
    // IMPORTANT: Make sure calculator_inputs exists and has valid values
    if (!leadCopy.calculator_inputs || Object.keys(leadCopy.calculator_inputs).length === 0) {
      leadCopy.calculator_inputs = {
        aiTier: leadCopy.calculator_results?.tierKey || 'growth',
        aiType: leadCopy.calculator_results?.aiType || 'both',
        callVolume: 0,
        role: 'customerService',
        numEmployees: leadCopy.employee_count || 5,
        chatVolume: 2000,
        avgCallDuration: 0,
        avgChatLength: 0,
        avgChatResolutionTime: 0
      };
    }
    
    setCurrentLead(leadCopy);
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
  
  // Update voice cost in calculator_results based on callVolume
  if (currentLead.calculator_inputs && 
      currentLead.calculator_results && 
      currentLead.calculator_results.aiCostMonthly) {
    
    // Force callVolume to be a number
    const callVolume = typeof currentLead.calculator_inputs.callVolume === 'number' 
      ? currentLead.calculator_inputs.callVolume 
      : 0;
    
    // Calculate voice cost (12¢ per minute)
    const voiceCost = callVolume * 0.12;
    
    // Update voice cost in results
    currentLead.calculator_results.aiCostMonthly.voice = voiceCost;
    
    // Update total cost
    const basePriceMonthly = currentLead.calculator_results.basePriceMonthly || 0;
    currentLead.calculator_results.aiCostMonthly.total = basePriceMonthly + voiceCost;
    
    console.log("Updated calculator_results with voice cost:", voiceCost);
    console.log("Updated total monthly cost:", currentLead.calculator_results.aiCostMonthly.total);
  }
  
  // Handle updates to the lead data
  const handleLeadUpdate = (updatedLead: Lead) => {
    console.log("DocumentGenerator received updated lead from edit dialog:", updatedLead);
    console.log("Updated callVolume:", updatedLead.calculator_inputs?.callVolume);
    
    // Create a deep copy to avoid reference issues
    const updatedLeadCopy = JSON.parse(JSON.stringify(updatedLead));
    
    // Update our local state with the new lead data
    setCurrentLead(updatedLeadCopy);
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
