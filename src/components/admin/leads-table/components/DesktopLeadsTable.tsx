
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
    <div className="hidden md:block overflow-x-auto pb-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Company</TableHead>
            <TableHead className="whitespace-nowrap">Contact</TableHead>
            <TableHead className="whitespace-nowrap">Industry</TableHead>
            <TableHead className="whitespace-nowrap">Size</TableHead>
            <TableHead className="whitespace-nowrap">Contact Info</TableHead>
            <TableHead className="whitespace-nowrap">Created</TableHead>
            <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="max-w-[180px] truncate">
                <CompanyDisplay 
                  companyName={lead.company_name}
                  website={lead.website}
                />
              </TableCell>
              <TableCell className="max-w-[150px] truncate">{lead.name}</TableCell>
              <TableCell className="max-w-[120px] truncate">{lead.industry || "N/A"}</TableCell>
              <TableCell className="whitespace-nowrap">{lead.employee_count || "N/A"}</TableCell>
              <TableCell className="max-w-[180px]">
                <ContactDisplay
                  email={lead.email}
                  phoneNumber={lead.phone_number}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <DateDisplay dateString={lead.created_at} />
              </TableCell>
              <TableCell className="text-right" style={{ minWidth: "320px" }}>
                <div className="flex justify-end space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(lead)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <DocumentGenerator lead={lead} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
