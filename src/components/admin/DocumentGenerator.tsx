
import { DocumentGenerator as NewDocumentGenerator } from "./document-generator/DocumentGenerator";
import { Lead } from "@/types/leads";
import { useState } from "react";
import { EditReportDialog } from "./document-generator/components/EditReportDialog";
import { useLeadEditing } from "./leads-table/hooks/useLeadEditing";
import { Button } from "@/components/ui/button";
import { FileEdit } from "lucide-react";

interface DocumentGeneratorProps {
  lead: Lead;
}

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const [isEditReportDialogOpen, setIsEditReportDialogOpen] = useState(false);
  const { handleSaveLead } = useLeadEditing();
  
  const handleOpenEditReportDialog = () => {
    setIsEditReportDialogOpen(true);
  };

  const handleCloseEditReportDialog = () => {
    setIsEditReportDialogOpen(false);
  };

  const handleSaveReportSettings = (updatedLead: Lead) => {
    handleSaveLead(updatedLead);
  };
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button 
          onClick={handleOpenEditReportDialog}
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
        >
          <FileEdit className="h-4 w-4" />
          Edit Report Settings
        </Button>
      </div>
      
      <NewDocumentGenerator lead={lead} />
      
      <EditReportDialog
        isOpen={isEditReportDialogOpen}
        onClose={handleCloseEditReportDialog}
        lead={lead}
        onSave={handleSaveReportSettings}
      />
    </div>
  );
};
