
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Lead } from "@/types/leads";
import { exportLeadsToCSV } from "@/utils/exportUtils";
import { LeadsDesktopView } from "./LeadsDesktopView";
import { LeadsMobileView } from "./LeadsMobileView";

interface LeadsTableProps {
  leads: Lead[];
}

export const LeadsTable = ({ leads }: LeadsTableProps) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
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
      
      {/* Desktop View - Traditional Table */}
      <div className="hidden md:block">
        <LeadsDesktopView leads={leads} />
      </div>

      {/* Mobile View - Card Layout */}
      <div className="block md:hidden">
        <LeadsMobileView leads={leads} />
      </div>
    </div>
  );
};
