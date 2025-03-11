
import React from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Lead } from "@/types/leads";
import { useProposalPreview } from "../hooks/useProposalPreview";

interface PreviewProposalButtonProps {
  lead: Lead;
  disabled?: boolean;
}

export const PreviewProposalButton = ({ lead, disabled }: PreviewProposalButtonProps) => {
  const { isLoading, handlePreviewProposal } = useProposalPreview();
  
  const onClick = async () => {
    console.log("Preview button clicked with lead:", lead);
    console.log("Lead calculator_inputs:", lead.calculator_inputs);
    console.log("Lead calculator_results:", lead.calculator_results);
    
    if (!lead.calculator_inputs || !lead.calculator_results) {
      console.error("Missing calculator data");
      return;
    }
    
    await handlePreviewProposal(lead);
  };
  
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant="outline"
      size="sm"
      className="whitespace-nowrap"
    >
      <Eye className="h-4 w-4 mr-1" />
      <span>{isLoading ? "Loading..." : "Preview"}</span>
    </Button>
  );
};
