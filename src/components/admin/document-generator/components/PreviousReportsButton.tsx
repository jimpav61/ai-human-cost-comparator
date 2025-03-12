
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { Lead } from "@/types/leads";
import { PreviousReportsDialog } from "./PreviousReportsDialog";

interface PreviousReportsButtonProps {
  lead: Lead;
  disabled?: boolean;
}

export const PreviousReportsButton = ({ lead, disabled }: PreviousReportsButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled}
        variant="outline"
        size="sm"
        className="whitespace-nowrap"
      >
        <History className="h-4 w-4 mr-1" />
        <span>Report History</span>
      </Button>
      
      <PreviousReportsDialog 
        lead={lead} 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </>
  );
};
