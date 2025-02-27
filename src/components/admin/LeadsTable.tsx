
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Lead } from "@/types/leads";
import { CompanyDisplay } from "./CompanyDisplay";
import { ContactDisplay } from "./ContactDisplay";
import { DateDisplay } from "./DateDisplay";
import { DocumentGenerator } from "./DocumentGenerator";
import { exportLeadsToCSV } from "@/utils/exportUtils";

interface LeadsTableProps {
  leads: Lead[];
}

export const LeadsTable = ({ leads }: LeadsTableProps) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">Lead Management</h2>
        <Button 
          onClick={() => exportLeadsToCSV(leads)}
          className="flex items-center gap-2"
        >
          <FileText size={16} />
          Export All to CSV
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <CompanyDisplay 
                  companyName={lead.company_name}
                  website={lead.website}
                />
              </TableCell>
              <TableCell>{lead.name}</TableCell>
              <TableCell>{lead.industry || "N/A"}</TableCell>
              <TableCell>{lead.employee_count || "N/A"}</TableCell>
              <TableCell>
                <ContactDisplay
                  email={lead.email}
                  phoneNumber={lead.phone_number}
                />
              </TableCell>
              <TableCell>
                <DateDisplay dateString={lead.created_at} />
              </TableCell>
              <TableCell>
                <DocumentGenerator lead={lead} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
