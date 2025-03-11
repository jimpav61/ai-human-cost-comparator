
import React from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Lead } from "@/types/leads";
import { useProposalPreview } from "../hooks/useProposalPreview";
import { toast } from "@/hooks/use-toast";

interface PreviewProposalButtonProps {
  lead: Lead;
  disabled?: boolean;
}

export const PreviewProposalButton = ({ lead, disabled }: PreviewProposalButtonProps) => {
  const { isLoading, handlePreviewProposal } = useProposalPreview();
  
  const onClick = async () => {
    console.log("Preview button clicked with lead:", lead);
    
    if (!lead.calculator_inputs || !lead.calculator_results) {
      console.error("Missing calculator data");
      toast({
        title: "Missing Data",
        description: "Calculator data is missing. Please edit the lead and configure calculator options first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await handlePreviewProposal(lead);
    } catch (error) {
      console.error("Error in preview button click handler:", error);
      // Error is already handled in the hook with toast
    }
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
