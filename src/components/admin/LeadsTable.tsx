
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Download, FileDown, Phone, Globe } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Lead } from "@/types/leads";

interface LeadsTableProps {
  leads: Lead[];
}

export const LeadsTable = ({ leads }: LeadsTableProps) => {
  const handleDownloadReport = async (lead: Lead) => {
    try {
      toast({
        title: "Download Started",
        description: `Downloading report for ${lead.company_name}...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  const handleGenerateProposal = async (lead: Lead) => {
    try {
      toast({
        title: "Generating Proposal",
        description: `Generating proposal for ${lead.company_name}...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate proposal",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Links</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                {lead.company_name}
              </TableCell>
              <TableCell>{lead.name}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div>{lead.email}</div>
                  {lead.phone_number && (
                    <a 
                      href={`tel:${lead.phone_number}`}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {lead.phone_number}
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {lead.website && (
                  <a 
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </a>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(lead)}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateProposal(lead)}
                    className="flex items-center"
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    Proposal
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
