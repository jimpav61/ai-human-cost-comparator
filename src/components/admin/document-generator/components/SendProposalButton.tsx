
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Lead } from "@/types/leads";
import { useProposalSend } from "../hooks/useProposalSend";

interface SendProposalButtonProps {
  lead: Lead;
  disabled?: boolean;
}

export const SendProposalButton = ({ lead, disabled }: SendProposalButtonProps) => {
  const { isLoading, handleSendProposal } = useProposalSend();
  
  const onClick = () => handleSendProposal(lead);
  
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant="outline"
      size="sm"
      className="whitespace-nowrap"
    >
      <FileText className="h-4 w-4 mr-1" />
      <span>{isLoading ? "Sending..." : "Send"}</span>
    </Button>
  );
};
