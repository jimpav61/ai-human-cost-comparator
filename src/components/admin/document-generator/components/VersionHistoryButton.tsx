
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/leads";
import { History } from "lucide-react";
import { ProposalVersionHistory } from "./ProposalVersionHistory";

interface VersionHistoryButtonProps {
  lead: Lead;
}

export const VersionHistoryButton = ({ lead }: VersionHistoryButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  
  return (
    <>
      <Button
        variant="outline"
        className="flex items-center space-x-1"
        onClick={handleOpenDialog}
      >
        <History className="h-4 w-4 mr-1" />
        Version History
      </Button>
      
      {isDialogOpen && (
        <ProposalVersionHistory 
          lead={lead}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
};
