
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { Lead } from "@/types/leads";
import { CompanyDisplay } from "../../CompanyDisplay";
import { ContactDisplay } from "../../ContactDisplay";
import { DateDisplay } from "../../DateDisplay";
import { DocumentGenerator } from "../../DocumentGenerator";

interface DesktopLeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
}

export const DesktopLeadsTable = ({ leads, onEdit }: DesktopLeadsTableProps) => {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
              <TableCell className="space-x-2 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(lead)}
                  className="mr-2"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <DocumentGenerator lead={lead} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
