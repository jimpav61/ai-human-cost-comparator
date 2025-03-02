
import { LeadsTable as RefactoredLeadsTable } from './leads-table/LeadsTable';
import { Lead } from "@/types/leads";

interface LeadsTableProps {
  leads: Lead[];
}

export const LeadsTable = ({ leads }: LeadsTableProps) => {
  return <RefactoredLeadsTable leads={leads} />;
};
