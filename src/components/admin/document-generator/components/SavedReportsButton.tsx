
import { useState } from "react";
import { Lead } from "@/types/leads";
import { Database, SaveAll } from "lucide-react";
import { SavedReportsDialog } from "./SavedReportsDialog";
import { useSavedReports } from "../hooks/useSavedReports";

interface SavedReportsButtonProps {
  lead: Lead;
}

export const SavedReportsButton = ({ lead }: SavedReportsButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { reports } = useSavedReports(lead.id);

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <Database className="h-4 w-4 mr-2" />
        Saved Reports {reports.length > 0 ? `(${reports.length})` : ''}
      </button>
      
      <SavedReportsDialog 
        lead={lead}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};
