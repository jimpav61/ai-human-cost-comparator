
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
  const { reports, isLoading } = useSavedReports(lead.id);
  
  // Determine button color based on whether reports exist
  const hasReports = reports.length > 0;
  const buttonClass = hasReports 
    ? "flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    : "flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors";
  
  const buttonText = hasReports ? "View Saved Reports" : "Create Report";
  
  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className={buttonClass}
      >
        <FileBarChart className="h-4 w-4 mr-2" />
        {buttonText}
      </button>
      
      <SavedReportsDialog 
        lead={lead}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};
