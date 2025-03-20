
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
import { StorageVerificationButton } from "../../StorageVerificationButton";

interface DesktopLeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
}

export const DesktopLeadsTable = ({ leads, onEdit }: DesktopLeadsTableProps) => {
  return (
    <div className="hidden md:block overflow-x-auto pb-2">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap w-[16%]">Company</TableHead>
            <TableHead className="whitespace-nowrap w-[12%]">Contact</TableHead>
            <TableHead className="whitespace-nowrap w-[12%]">Industry</TableHead>
            <TableHead className="whitespace-nowrap w-[8%]">Size</TableHead>
            <TableHead className="whitespace-nowrap w-[16%]">Contact Info</TableHead>
            <TableHead className="whitespace-nowrap w-[16%]">Created</TableHead>
            <TableHead className="whitespace-nowrap text-right w-[20%]">Actions</TableHead>
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
              <TableCell className="text-right">
                <div className="flex justify-end flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(lead)}
                    className="text-xs py-1 h-8 px-2"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <StorageVerificationButton lead={lead} />
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
