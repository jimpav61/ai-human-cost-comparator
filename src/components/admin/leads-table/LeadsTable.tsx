
import { Lead } from "@/types/leads";
import { TableHeader } from "./components/TableHeader";
import { DesktopLeadsTable } from "./components/DesktopLeadsTable";
import { MobileLeadsView } from "./components/MobileLeadsView";
import { EditLeadDialog } from "../edit-lead/EditLeadDialog";
import { useLeadEditing } from "./hooks/useLeadEditing";

interface LeadsTableProps {
  leads: Lead[];
  onLeadUpdated?: () => void;
}

export const LeadsTable = ({ leads, onLeadUpdated }: LeadsTableProps) => {
  const {
    editingLead,
    isEditDialogOpen,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleSaveLead
  } = useLeadEditing(onLeadUpdated);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden w-full">
      <TableHeader leads={leads} />
      <div className="overflow-x-auto">
        <DesktopLeadsTable leads={leads} onEdit={handleOpenEditDialog} />
        <MobileLeadsView leads={leads} onEdit={handleOpenEditDialog} />
      </div>

      {/* Edit Lead Dialog - Render only when a lead is selected */}
      {editingLead && (
        <EditLeadDialog
          lead={editingLead}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onSave={handleSaveLead}
        />
      )}
    </div>
  );
};
