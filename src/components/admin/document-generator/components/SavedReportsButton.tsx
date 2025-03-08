
import { useState } from "react";
import { Lead } from "@/types/leads";
import { Files } from "lucide-react";
import { SavedReportsDialog } from "./SavedReportsDialog";

interface SavedReportsButtonProps {
  lead: Lead;
}

export const SavedReportsButton = ({ lead }: SavedReportsButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <Files className="h-4 w-4 mr-1" />
        View Reports
      </button>
      
      <SavedReportsDialog 
        lead={lead}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};
