
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Lead } from "@/types/leads";
import { EditReportDialog } from "./EditReportDialog";
import { useProposalEdit } from "../hooks/useProposalEdit";

interface EditProposalButtonProps {
  lead: Lead;
  onLeadUpdated?: (updatedLead: Lead) => void;
  disabled?: boolean;
}

export const EditProposalButton = ({ lead, onLeadUpdated, disabled }: EditProposalButtonProps) => {
  const {
    isDialogOpen,
    handleOpenDialog,
    handleCloseDialog,
    handleSaveProposalSettings
  } = useProposalEdit(lead, onLeadUpdated);
  
  return (
    <>
      <Button
        onClick={handleOpenDialog}
        disabled={disabled}
        variant="outline"
        size="sm"
        className="whitespace-nowrap"
      >
        <Pencil className="h-4 w-4 mr-1" />
        <span>Edit Proposal</span>
      </Button>
      
      {isDialogOpen && (
        <EditReportDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          lead={lead}
          onSave={handleSaveProposalSettings}
        />
      )}
    </>
  );
};
