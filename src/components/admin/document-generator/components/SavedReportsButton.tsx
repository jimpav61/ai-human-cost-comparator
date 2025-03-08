
import { useState } from "react";
import { Lead } from "@/types/leads";
import { FileBarChart } from "lucide-react";
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
        className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        <FileBarChart className="h-4 w-4 mr-2" />
        View Saved Report
      </button>
      
      <SavedReportsDialog 
        lead={lead}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};
