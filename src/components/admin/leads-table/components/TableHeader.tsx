
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Lead } from "@/types/leads";
import { exportLeadsToCSV } from "@/utils/exportUtils";

interface TableHeaderProps {
  leads: Lead[];
}

export const TableHeader = ({ leads }: TableHeaderProps) => {
  return (
    <div className="p-3 sm:p-4 flex justify-between items-center border-b flex-wrap gap-2">
      <h2 className="text-base sm:text-lg font-semibold">Lead Management</h2>
      <Button 
        onClick={() => exportLeadsToCSV(leads)}
        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        size="sm"
      >
        <FileText size={16} />
        <span className="hidden xs:inline">Export All to CSV</span>
        <span className="inline xs:hidden">Export</span>
      </Button>
    </div>
  );
};
