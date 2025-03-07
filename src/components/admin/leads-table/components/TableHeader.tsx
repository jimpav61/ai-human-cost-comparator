
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Lead } from "@/types/leads";
import { exportLeadsToCSV } from "@/utils/exportUtils";

interface TableHeaderProps {
  leads: Lead[];
}

export const TableHeader = ({ leads }: TableHeaderProps) => {
  return (
    <div className="p-4 flex justify-between items-center border-b flex-wrap gap-2">
      <h2 className="text-lg font-semibold">Lead Management</h2>
      <Button 
        onClick={() => exportLeadsToCSV(leads)}
        className="flex items-center gap-2"
      >
        <FileText size={16} />
        Export All to CSV
      </Button>
    </div>
  );
};
