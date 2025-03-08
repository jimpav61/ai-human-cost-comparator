
import { useState } from "react";
import { Lead } from "@/types/leads";
import { FileBarChart } from "lucide-react";
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
        className="flex items-center px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
      >
        <FileBarChart className="h-4 w-4 mr-1" />
        Saved Reports
      </button>
      
      <SavedReportsDialog 
        lead={lead}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};
