
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
        className="flex items-center gap-1 whitespace-nowrap text-xs sm:text-sm"
        onClick={handleOpenDialog}
        size="sm"
      >
        <History className="h-3.5 w-3.5" />
        <span>History</span>
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
